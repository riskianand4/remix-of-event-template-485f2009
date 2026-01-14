// Production security utilities - SIMPLIFIED VERSION
// Most security features disabled to avoid blocking app functionality

import { logger } from './logger';

class ProductionSecurity {
  private isProduction = import.meta.env.PROD;
  
  // Initialize security measures - most disabled for compatibility
  initialize(): void {
    // Security features disabled - CSP and inspection blocking cause issues
    // Only basic security utilities remain available
    if (this.isProduction) {
      logger.info('Production security initialized (relaxed mode)');
    }
  }
  
  // Validate and sanitize user input
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: urls
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  
  // Check for XSS attempts
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  // Generate secure random token
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Validate API response for potential security issues
  validateApiResponse(response: any): boolean {
    if (!response || typeof response !== 'object') return false;
    
    // Check for potential XSS in response data
    const jsonString = JSON.stringify(response);
    if (this.detectXSS(jsonString)) {
      logger.error('SECURITY: Potential XSS detected in API response');
      return false;
    }
    
    return true;
  }
}

export const productionSecurity = new ProductionSecurity();
