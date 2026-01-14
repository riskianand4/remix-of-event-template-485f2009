import { logger } from './logger';

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  errorRate: number;
}

class ProductionOptimizer {
  private metrics: PerformanceMetrics = {
    bundleSize: 0,
    loadTime: 0,
    memoryUsage: 0,
    errorRate: 0
  };

  optimizeBundleLoading(): void {
    if (typeof window === 'undefined') return;
    this.registerServiceWorker();
    this.optimizeImageLoading();
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  private optimizeImageLoading(): void {
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
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  monitorPerformance(): void {
    if (typeof window === 'undefined') return;

    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.includes('.js'));
      this.metrics.bundleSize = jsResources.reduce((total, resource) => {
        return total + ((resource as any).transferSize || 0);
      }, 0);
    }

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }

    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
    }

    setInterval(() => {
      if (this.metrics.bundleSize > 5 * 1024 * 1024) {
        logger.warn('Bundle size exceeding threshold', { size: this.metrics.bundleSize });
      }
      if (this.metrics.memoryUsage > 100 * 1024 * 1024) {
        logger.warn('Memory usage high', { usage: this.metrics.memoryUsage });
      }
    }, 300000);
  }

  trackError(): void {
    this.metrics.errorRate += 1;
  }

  getPerformanceScore(): number {
    let score = 100;
    if (this.metrics.bundleSize > 2 * 1024 * 1024) score -= 20;
    if (this.metrics.loadTime > 3000) score -= 25;
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) score -= 15;
    if (this.metrics.errorRate > 5) score -= 40;
    return Math.max(0, score);
  }

  initialize(): void {
    this.optimizeBundleLoading();
    this.monitorPerformance();
  }
}

export const productionOptimizer = new ProductionOptimizer();

if (import.meta.env.PROD && typeof window !== 'undefined') {
  productionOptimizer.initialize();
}
