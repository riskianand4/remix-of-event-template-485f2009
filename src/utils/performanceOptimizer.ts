// Advanced performance optimization utilities
import { PRODUCTION_CONFIG } from '@/config/production';
import { logger } from './logger';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage: number;
  bundleSize: number;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    memoryUsage: 0,
    bundleSize: 0,
  };
  
  private observers: PerformanceObserver[] = [];
  
  // Initialize performance monitoring
  initialize(): void {
    if (typeof window === 'undefined') return;
    
    this.measureLoadTime();
    this.measureWebVitals();
    this.optimizeResources();
    this.monitorMemoryUsage();
    this.setupServiceWorker();
    
    // Start periodic monitoring
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
  }
  
  // Measure page load time
  private measureLoadTime(): void {
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      this.metrics.loadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      if (this.metrics.loadTime > PRODUCTION_CONFIG.PERFORMANCE.LOAD_TIME_LIMIT) {
        logger.warn('PERFORMANCE: Load time exceeds threshold', {
          loadTime: this.metrics.loadTime,
          threshold: PRODUCTION_CONFIG.PERFORMANCE.LOAD_TIME_LIMIT,
        });
      }
    });
  }
  
  // Measure Core Web Vitals
  private measureWebVitals(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          this.metrics.firstContentfulPaint = fcp.startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
      
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
      
      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cumulativeLayoutShift += clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0];
        if (firstInput) {
          this.metrics.firstInputDelay = (firstInput as any).processingStart - firstInput.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }
  }
  
  // Optimize resource loading
  private optimizeResources(): void {
    // Preload critical resources
    const criticalResources = [
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2' },
      { href: '/api/auth/verify', as: 'fetch' },
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.as === 'font') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
    
    // Prefetch next likely pages
    const prefetchPages = ['/dashboard', '/products', '/inventory'];
    prefetchPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
    
    // Optimize images with lazy loading
    this.optimizeImages();
  }
  
  // Optimize image loading
  private optimizeImages(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.1,
      });
      
      // Observe existing images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
      
      // Observe future images
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLImageElement && node.dataset.src) {
              imageObserver.observe(node);
            }
            if (node instanceof HTMLElement) {
              node.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
              });
            }
          });
        });
      });
      
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }
  
  // Monitor memory usage
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        if (this.metrics.memoryUsage > PRODUCTION_CONFIG.PERFORMANCE.MEMORY_LIMIT) {
          logger.warn('PERFORMANCE: Memory usage exceeds threshold', {
            current: this.metrics.memoryUsage,
            threshold: PRODUCTION_CONFIG.PERFORMANCE.MEMORY_LIMIT,
          });
          
          // Suggest garbage collection
          this.suggestGarbageCollection();
        }
      }, 60000); // Every minute
    }
  }
  
  // Setup Service Worker for caching
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator && import.meta.env.PROD && PRODUCTION_CONFIG.CACHE.ENABLE_SERVICE_WORKER) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('Service Worker registered', { scope: registration.scope });
          
          // Update service worker when new version is available
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is ready
                  this.notifyUserOfUpdate();
                }
              });
            }
          });
        })
        .catch((error) => {
          logger.error('Service Worker registration failed', error);
        });
    }
  }
  
  // Collect and analyze performance metrics
  private collectMetrics(): void {
    // Bundle size analysis
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.includes('.js'));
      this.metrics.bundleSize = jsResources.reduce((total, resource) => {
        return total + ((resource as any).transferSize || 0);
      }, 0);
      
      if (this.metrics.bundleSize > PRODUCTION_CONFIG.PERFORMANCE.BUNDLE_SIZE_LIMIT) {
        logger.warn('PERFORMANCE: Bundle size exceeds threshold', {
          current: this.metrics.bundleSize,
          threshold: PRODUCTION_CONFIG.PERFORMANCE.BUNDLE_SIZE_LIMIT,
        });
      }
    }
    
    // Calculate performance score
    const score = this.calculatePerformanceScore();
    if (score < 70) {
      logger.warn('PERFORMANCE: Performance score below threshold', { score });
    }
  }
  
  // Calculate overall performance score (0-100)
  private calculatePerformanceScore(): number {
    let score = 100;
    
    // Deduct points for poor metrics
    if (this.metrics.loadTime > 3000) score -= 20;
    if (this.metrics.firstContentfulPaint > 2000) score -= 15;
    if (this.metrics.largestContentfulPaint > 4000) score -= 20;
    if (this.metrics.cumulativeLayoutShift > 0.1) score -= 15;
    if (this.metrics.firstInputDelay > 100) score -= 10;
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) score -= 10;
    if (this.metrics.bundleSize > 2 * 1024 * 1024) score -= 10;
    
    return Math.max(0, score);
  }
  
  // Suggest garbage collection
  private suggestGarbageCollection(): void {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old-') || name.includes('temp-')) {
            caches.delete(name);
          }
        });
      });
    }
    
    // Clear unnecessary data from memory
    this.clearMemoryLeaks();
  }
  
  // Clear potential memory leaks
  private clearMemoryLeaks(): void {
    // Clear old performance entries
    if (performance.clearResourceTimings) {
      performance.clearResourceTimings();
    }
    
    // Suggest component re-render by dispatching custom event
    window.dispatchEvent(new CustomEvent('memory-cleanup-suggested'));
  }
  
  // Notify user of app update
  private notifyUserOfUpdate(): void {
    window.dispatchEvent(new CustomEvent('app-update-available'));
  }
  
  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  // Clean up observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  performanceOptimizer.initialize();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    performanceOptimizer.cleanup();
  });
}