/**
 * @fileoverview Performance monitoring and optimization utilities
 * Provides comprehensive performance tracking and optimization features
 */

import { analytics, EVENT_TYPES } from './analytics.js';
// Error handling imports - commented out to avoid unused variable warnings
// import { ToneTrackerError, ERROR_CATEGORIES, ERROR_LEVELS } from './errorHandler.js';

/**
 * Performance metrics collection
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.startTimes = new Map();
    this.isEnabled = true;

    // Initialize performance observers
    this.initializeObservers();

    // Track initial page load metrics
    this.trackPageLoad();
  }

  /**
   * Initialize performance observers
   * @private
   */
  initializeObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry);
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.recordResourceMetrics(entry);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);

        // Paint timing
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'paint') {
              this.recordPaintMetrics(entry);
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);

        // Largest Contentful Paint
        if (
          'largest-contentful-paint' in PerformanceObserver.supportedEntryTypes
        ) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              this.recordMetric('largest-contentful-paint', entry.startTime);
            });
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          this.observers.set('lcp', lcpObserver);
        }

        // First Input Delay
        if ('first-input' in PerformanceObserver.supportedEntryTypes) {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              this.recordMetric(
                'first-input-delay',
                entry.processingStart - entry.startTime
              );
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
          this.observers.set('fid', fidObserver);
        }

        // Layout shift
        if ('layout-shift' in PerformanceObserver.supportedEntryTypes) {
          let cumulativeLayoutShift = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (!entry.hadRecentInput) {
                cumulativeLayoutShift += entry.value;
                this.recordMetric(
                  'cumulative-layout-shift',
                  cumulativeLayoutShift
                );
              }
            });
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          this.observers.set('cls', clsObserver);
        }
      } catch (error) {
        console.warn('Performance observers not supported:', error);
      }
    }
  }

  /**
   * Track page load performance
   * @private
   */
  trackPageLoad() {
    if ('performance' in window && 'timing' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const navigation = performance.getEntriesByType('navigation')[0];

          const metrics = {
            // Navigation timing metrics
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            ssl:
              timing.secureConnectionStart > 0
                ? timing.connectEnd - timing.secureConnectionStart
                : 0,
            ttfb: timing.responseStart - timing.navigationStart,
            download: timing.responseEnd - timing.responseStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            domContentLoaded:
              timing.domContentLoadedEventEnd - timing.navigationStart,
            domComplete: timing.domComplete - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,

            // Navigation API v2 metrics (if available)
            ...(navigation && {
              redirectTime: navigation.redirectEnd - navigation.redirectStart,
              workerTime:
                navigation.workerStart > 0
                  ? navigation.responseStart - navigation.workerStart
                  : 0,
              fetchTime: navigation.responseEnd - navigation.fetchStart,
            }),
          };

          // Record all metrics
          Object.entries(metrics).forEach(([name, value]) => {
            if (value >= 0) {
              this.recordMetric(`page-load-${name}`, value);
            }
          });

          // Track overall page load time
          analytics.trackPerformance('page-load-total', metrics.loadComplete);
        }, 100); // Small delay to ensure all timing data is available
      });
    }
  }

  /**
   * Record navigation timing metrics
   * @private
   */
  recordNavigationMetrics(entry) {
    const metrics = {
      'nav-redirect-time': entry.redirectEnd - entry.redirectStart,
      'nav-dns-time': entry.domainLookupEnd - entry.domainLookupStart,
      'nav-connect-time': entry.connectEnd - entry.connectStart,
      'nav-request-time': entry.responseStart - entry.requestStart,
      'nav-response-time': entry.responseEnd - entry.responseStart,
      'nav-dom-interactive': entry.domInteractive,
      'nav-dom-content-loaded': entry.domContentLoadedEventEnd,
      'nav-load-complete': entry.loadEventEnd,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value >= 0) {
        this.recordMetric(name, value);
      }
    });
  }

  /**
   * Record resource timing metrics
   * @private
   */
  recordResourceMetrics(entry) {
    const resourceType = this.getResourceType(entry.name);
    const duration = entry.responseEnd - entry.startTime;

    this.recordMetric(`resource-${resourceType}-time`, duration);

    // Track slow resources (>1s)
    if (duration > 1000) {
      analytics.track(EVENT_TYPES.PERFORMANCE_ISSUE, {
        type: 'slow-resource',
        resource: entry.name,
        duration: duration,
        resourceType: resourceType,
      });
    }
  }

  /**
   * Record paint timing metrics
   * @private
   */
  recordPaintMetrics(entry) {
    this.recordMetric(entry.name, entry.startTime);
    analytics.trackPerformance(entry.name, entry.startTime);
  }

  /**
   * Get resource type from URL
   * @private
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  /**
   * Start timing a custom operation
   * @param {string} label - Timing label
   */
  startTiming(label) {
    if (!this.isEnabled) return;

    this.startTimes.set(label, performance.now());
  }

  /**
   * End timing and record metric
   * @param {string} label - Timing label
   * @param {Object} context - Additional context
   */
  endTiming(label, context = {}) {
    if (!this.isEnabled) return;

    const startTime = this.startTimes.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
      this.startTimes.delete(label);

      analytics.trackPerformance(label, duration, context);
    }
  }

  /**
   * Record a performance metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {string} unit - Unit of measurement
   */
  recordMetric(name, value, unit = 'ms') {
    if (!this.isEnabled) return;

    const metric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.set(name, metric);

    // Log performance issues
    this.checkPerformanceThresholds(name, value);
  }

  /**
   * Check if metrics exceed performance thresholds
   * @private
   */
  checkPerformanceThresholds(name, value) {
    const thresholds = {
      'page-load-total': 3000,
      'largest-contentful-paint': 2500,
      'first-input-delay': 100,
      'cumulative-layout-shift': 0.1,
      'first-contentful-paint': 1800,
      'time-to-interactive': 3800,
    };

    const threshold = thresholds[name];
    if (threshold && value > threshold) {
      analytics.track(EVENT_TYPES.PERFORMANCE_ISSUE, {
        metric: name,
        value: value,
        threshold: threshold,
        severity: value > threshold * 2 ? 'high' : 'medium',
      });
    }
  }

  /**
   * Get all recorded metrics
   * @returns {Map} All metrics
   */
  getMetrics() {
    return new Map(this.metrics);
  }

  /**
   * Get specific metric
   * @param {string} name - Metric name
   * @returns {Object|null} Metric data
   */
  getMetric(name) {
    return this.metrics.get(name) || null;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Generate performance report
   * @returns {Object} Performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      summary: {
        totalMetrics: this.metrics.size,
        criticalIssues: 0,
        warnings: 0,
      },
    };

    // Analyze metrics for issues
    this.metrics.forEach((metric, name) => {
      const thresholds = {
        'page-load-total': { critical: 5000, warning: 3000 },
        'largest-contentful-paint': { critical: 4000, warning: 2500 },
        'first-input-delay': { critical: 300, warning: 100 },
        'cumulative-layout-shift': { critical: 0.25, warning: 0.1 },
      };

      const threshold = thresholds[name];
      if (threshold) {
        if (metric.value > threshold.critical) {
          report.summary.criticalIssues++;
        } else if (metric.value > threshold.warning) {
          report.summary.warnings++;
        }
      }
    });

    return report;
  }

  /**
   * Cleanup performance monitor
   */
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.clearMetrics();
  }
}

/**
 * Memory monitoring utilities
 */
export class MemoryMonitor {
  constructor() {
    this.snapshots = [];
    this.isEnabled = 'memory' in performance;
  }

  /**
   * Take memory snapshot
   * @returns {Object|null} Memory snapshot
   */
  takeSnapshot() {
    if (!this.isEnabled) return null;

    const memory = performance.memory;
    const snapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      heapUsagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };

    this.snapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }

    // Check for memory leaks
    this.checkMemoryLeaks(snapshot);

    return snapshot;
  }

  /**
   * Check for potential memory leaks
   * @private
   */
  checkMemoryLeaks(snapshot) {
    if (this.snapshots.length < 10) return;

    // Check if memory usage has increased significantly over time
    const recent = this.snapshots.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const growthRate =
      (last.usedJSHeapSize - first.usedJSHeapSize) / first.usedJSHeapSize;

    if (growthRate > 0.5) {
      // 50% increase
      analytics.track(EVENT_TYPES.PERFORMANCE_ISSUE, {
        type: 'potential-memory-leak',
        growthRate: growthRate,
        currentUsage: snapshot.heapUsagePercent,
        totalHeapSize: snapshot.totalJSHeapSize,
      });
    }

    // Warn if heap usage is very high
    if (snapshot.heapUsagePercent > 90) {
      analytics.track(EVENT_TYPES.PERFORMANCE_ISSUE, {
        type: 'high-memory-usage',
        heapUsagePercent: snapshot.heapUsagePercent,
        severity: 'critical',
      });
    }
  }

  /**
   * Get memory usage trend
   * @returns {Object} Memory trend analysis
   */
  getMemoryTrend() {
    if (this.snapshots.length < 2) return null;

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    return {
      timespan: last.timestamp - first.timestamp,
      startUsage: first.usedJSHeapSize,
      endUsage: last.usedJSHeapSize,
      growth: last.usedJSHeapSize - first.usedJSHeapSize,
      growthRate:
        (last.usedJSHeapSize - first.usedJSHeapSize) / first.usedJSHeapSize,
      averageUsage:
        this.snapshots.reduce((sum, s) => sum + s.usedJSHeapSize, 0) /
        this.snapshots.length,
      peakUsage: Math.max(...this.snapshots.map((s) => s.usedJSHeapSize)),
    };
  }
}

/**
 * FPS (Frames Per Second) monitoring
 */
export class FPSMonitor {
  constructor() {
    this.samples = [];
    this.lastTime = performance.now();
    this.isRunning = false;
    this.animationId = null;
  }

  /**
   * Start FPS monitoring
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  /**
   * Stop FPS monitoring
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * FPS measurement tick
   * @private
   */
  tick() {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    const fps = 1000 / delta;

    this.samples.push({
      timestamp: now,
      fps: fps,
      frameTime: delta,
    });

    // Keep only last 60 samples (approximately 1 second at 60fps)
    if (this.samples.length > 60) {
      this.samples = this.samples.slice(-60);
    }

    // Check for FPS drops
    if (fps < 30 && this.samples.length > 10) {
      const avgFps =
        this.samples.reduce((sum, s) => sum + s.fps, 0) / this.samples.length;
      if (avgFps < 45) {
        analytics.track(EVENT_TYPES.PERFORMANCE_ISSUE, {
          type: 'low-fps',
          currentFps: fps,
          averageFps: avgFps,
          severity: fps < 20 ? 'critical' : 'medium',
        });
      }
    }

    this.lastTime = now;
    this.animationId = requestAnimationFrame(() => this.tick());
  }

  /**
   * Get current FPS statistics
   * @returns {Object} FPS statistics
   */
  getStats() {
    if (this.samples.length === 0) return null;

    const fps = this.samples.map((s) => s.fps);
    const frameTimes = this.samples.map((s) => s.frameTime);

    return {
      currentFps: fps[fps.length - 1],
      averageFps: fps.reduce((sum, f) => sum + f, 0) / fps.length,
      minFps: Math.min(...fps),
      maxFps: Math.max(...fps),
      averageFrameTime:
        frameTimes.reduce((sum, f) => sum + f, 0) / frameTimes.length,
      samples: this.samples.length,
    };
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const memoryMonitor = new MemoryMonitor();
export const fpsMonitor = new FPSMonitor();

// Convenience functions
export const startTiming = (label) => performanceMonitor.startTiming(label);
export const endTiming = (label, context) =>
  performanceMonitor.endTiming(label, context);
export const recordMetric = (name, value, unit) =>
  performanceMonitor.recordMetric(name, value, unit);
export const takeMemorySnapshot = () => memoryMonitor.takeSnapshot();
export const startFPSMonitoring = () => fpsMonitor.start();
export const stopFPSMonitoring = () => fpsMonitor.stop();
