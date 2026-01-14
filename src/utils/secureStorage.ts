import { createComponentLogger } from '@/utils/logger';
import { deviceFingerprintManager, DeviceFingerprint } from './deviceFingerprint';

interface SecureTokenData {
  token: string;
  deviceId: string;
  ipAddress?: string;
  createdAt: number;
  lastUsed: number;
  fingerprint: DeviceFingerprint;
}

class SecureStorageManager {
  private logger = createComponentLogger('SecureStorage');
  private readonly TOKEN_KEY = 'secure-auth-token';
  private readonly DEVICE_KEY = 'device-fingerprint';
  private encryptionKey: CryptoKey | null = null;

  // Generate encryption key from device fingerprint
  private async generateEncryptionKey(deviceId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceId + window.location.origin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('secure-token-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt data using AES-GCM
  private async encryptData(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  // Decrypt data using AES-GCM
  private async decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Store token securely with device binding
  async storeSecureToken(token: string, user: any): Promise<boolean> {
    try {
      const fingerprint = await deviceFingerprintManager.getFingerprint();
      const ipAddress = await this.getCurrentIP();

      const tokenData: SecureTokenData = {
        token,
        deviceId: fingerprint.id,
        ipAddress,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        fingerprint,
      };

      // Generate encryption key
      this.encryptionKey = await this.generateEncryptionKey(fingerprint.id);
      
      // Encrypt token data
      const encryptedData = await this.encryptData(JSON.stringify(tokenData), this.encryptionKey);
      
      // Store encrypted data
      localStorage.setItem(this.TOKEN_KEY, encryptedData);
      localStorage.setItem(this.DEVICE_KEY, JSON.stringify(fingerprint));
      
      // Store user data (less sensitive, but still important)
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('lastLoginTime', Date.now().toString());

      this.logger.info('Secure token stored successfully', { deviceId: fingerprint.id });
      return true;
    } catch (error) {
      this.logger.error('Failed to store secure token', error);
      return false;
    }
  }

  // Retrieve and validate token
  async getSecureToken(): Promise<{ token: string; isValid: boolean; reason?: string } | null> {
    try {
      const encryptedData = localStorage.getItem(this.TOKEN_KEY);
      const storedFingerprint = localStorage.getItem(this.DEVICE_KEY);
      
      // Fallback 1: Try encrypted token first
      if (encryptedData && storedFingerprint) {
        try {

      const deviceFingerprint: DeviceFingerprint = JSON.parse(storedFingerprint);
      
      // Validate current device against stored fingerprint
      const isValidDevice = await deviceFingerprintManager.validateDevice(deviceFingerprint);
      
      if (!isValidDevice) {
        this.logger.warn('Device validation warning - fingerprint changed (browser settings/extensions)', {
          reason: 'Browser settings or extensions may have changed'
        });
        // Don't clear token - just log warning for monitoring
      }

      // Generate encryption key
      this.encryptionKey = await this.generateEncryptionKey(deviceFingerprint.id);
      
      // Decrypt token data
      const decryptedData = await this.decryptData(encryptedData, this.encryptionKey);
      const tokenData: SecureTokenData = JSON.parse(decryptedData);

      // Check if token is too old (30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (Date.now() - tokenData.createdAt > maxAge) {
        this.logger.warn('Token is old but still accepting', {
          age: Math.round((Date.now() - tokenData.createdAt) / (24 * 60 * 60 * 1000)) + ' days'
        });
        // Don't clear - let backend decide if token is expired
      }

      // Check IP address change (optional - might be too strict)
      const currentIP = await this.getCurrentIP();
      if (tokenData.ipAddress && currentIP && tokenData.ipAddress !== currentIP) {
        this.logger.warn('IP address changed', { 
          stored: tokenData.ipAddress, 
          current: currentIP 
        });
        // Don't invalidate immediately, but log for monitoring
      }

      // Update last used timestamp
      tokenData.lastUsed = Date.now();
      const updatedEncryptedData = await this.encryptData(JSON.stringify(tokenData), this.encryptionKey);
      localStorage.setItem(this.TOKEN_KEY, updatedEncryptedData);

      return { token: tokenData.token, isValid: true };
        } catch (decryptError) {
          this.logger.warn('Decryption failed, trying fallback', decryptError);
        }
      }
      
      // Fallback 2: Use plain token from localStorage
      const plainToken = localStorage.getItem('auth-token');
      if (plainToken) {
        this.logger.info('Using fallback plain token');
        return { token: plainToken, isValid: true };
      }
      
      return null;
    } catch (error) {
      this.logger.error('All token retrieval methods failed', error);
      // Don't clear token here - let user continue
      return null;
    }
  }

  // Clear all secure data
  async clearSecureToken(): Promise<void> {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.DEVICE_KEY);
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token'); // Clear legacy token
      localStorage.removeItem('lastLoginTime');
      
      this.encryptionKey = null;
      
      this.logger.info('Secure token cleared');
    } catch (error) {
      this.logger.error('Failed to clear secure token', error);
    }
  }

  // Get current IP address - disabled to avoid CSP issues
  private async getCurrentIP(): Promise<string | null> {
    // IP tracking disabled - returns null to avoid external API calls
    return null;
  }

  // Check if token exists and is recent (for skip verification)
  isRecentLogin(withinMs: number = 60000): boolean {
    try {
      const lastLoginTime = parseInt(localStorage.getItem('lastLoginTime') || '0');
      return Date.now() - lastLoginTime < withinMs;
    } catch {
      return false;
    }
  }
}

export const secureStorageManager = new SecureStorageManager();
export type { SecureTokenData };