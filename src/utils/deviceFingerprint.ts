import { createComponentLogger } from '@/utils/logger';

interface DeviceFingerprint {
  id: string;
  components: {
    screen: string;
    timezone: string;
    language: string;
    platform: string;
    webgl: string;
    canvas: string;
    audio: string;
    fonts: string;
  };
  createdAt: number;
}

class DeviceFingerprintManager {
  private logger = createComponentLogger('DeviceFingerprint');
  private fingerprint: DeviceFingerprint | null = null;

  // Generate canvas fingerprint
  private generateCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Security layer', 4, 35);

      return canvas.toDataURL();
    } catch (error) {
      this.logger.warn('Canvas fingerprint failed', error);
      return 'canvas-error';
    }
  }

  // Generate WebGL fingerprint
  private generateWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      
      return `${vendor}|${renderer}`;
    } catch (error) {
      this.logger.warn('WebGL fingerprint failed', error);
      return 'webgl-error';
    }
  }

  // Generate audio fingerprint
  private generateAudioFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          resolve('no-audio');
          return;
        }

        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(audioContext.destination);

        let audioData = '';
        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          audioData = buffer.slice(0, 10).join(',');
          oscillator.stop();
          audioContext.close();
          resolve(audioData || 'audio-empty');
        };

        oscillator.start(0);
        
        // Fallback timeout
        setTimeout(() => resolve('audio-timeout'), 1000);
      } catch (error) {
        this.logger.warn('Audio fingerprint failed', error);
        resolve('audio-error');
      }
    });
  }

  // Get available fonts
  private getAvailableFonts(): string {
    const fonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Helvetica',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Tahoma',
      'Comic Sans MS', 'Impact', 'Arial Black', 'Trebuchet MS'
    ];

    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-font-canvas';

    // Get baseline measurements
    ctx.font = `${testSize} monospace`;
    const baselineWidth = ctx.measureText(testString).width;

    const availableFonts: string[] = [];
    
    fonts.forEach(font => {
      ctx.font = `${testSize} ${font}, monospace`;
      const width = ctx.measureText(testString).width;
      if (width !== baselineWidth) {
        availableFonts.push(font);
      }
    });

    return availableFonts.sort().join(',') || 'no-fonts';
  }

  // Generate complete device fingerprint
  async generateFingerprint(): Promise<DeviceFingerprint> {
    try {
      const audioFingerprint = await this.generateAudioFingerprint();
      
      const components = {
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        webgl: this.generateWebGLFingerprint(),
        canvas: this.generateCanvasFingerprint(),
        audio: audioFingerprint,
        fonts: this.getAvailableFonts(),
      };

      // Create hash from components
      const componentsString = JSON.stringify(components);
      const encoder = new TextEncoder();
      const data = encoder.encode(componentsString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const id = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

      this.fingerprint = {
        id,
        components,
        createdAt: Date.now(),
      };

      this.logger.info('Device fingerprint generated', { id });
      return this.fingerprint;
    } catch (error) {
      this.logger.error('Failed to generate fingerprint', error);
      throw error;
    }
  }

  // Get cached fingerprint or generate new one
  async getFingerprint(): Promise<DeviceFingerprint> {
    if (this.fingerprint) {
      return this.fingerprint;
    }
    return await this.generateFingerprint();
  }

  // Validate if current device matches stored fingerprint
  async validateDevice(storedFingerprint: DeviceFingerprint): Promise<boolean> {
    try {
      const currentFingerprint = await this.getFingerprint();
      
      // Allow some components to change (screen resolution, etc.)
      const criticalComponents = ['webgl', 'canvas', 'audio', 'fonts'];
      
      let matches = 0;
      for (const component of criticalComponents) {
        if (currentFingerprint.components[component as keyof typeof currentFingerprint.components] === 
            storedFingerprint.components[component as keyof typeof storedFingerprint.components]) {
          matches++;
        }
      }

      // Require at least 75% match on critical components
      const isValid = matches >= Math.ceil(criticalComponents.length * 0.75);
      
      this.logger.info('Device validation result', { 
        matches, 
        total: criticalComponents.length, 
        isValid,
        currentId: currentFingerprint.id,
        storedId: storedFingerprint.id
      });

      return isValid;
    } catch (error) {
      this.logger.error('Device validation failed', error);
      return false;
    }
  }
}

export const deviceFingerprintManager = new DeviceFingerprintManager();
export type { DeviceFingerprint };