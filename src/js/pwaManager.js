/**
 * @fileoverview PWA Manager for handling Progressive Web App functionality
 * Manages service worker, caching, offline support, and app installation
 */

import { analytics, EVENT_TYPES } from './analytics.js';
import {
  ToneTrackerError,
  ERROR_CATEGORIES,
  ERROR_LEVELS,
} from './errorHandler.js';

/**
 * PWA Manager class for handling Progressive Web App features
 */
export class PWAManager {
  constructor() {
    this.serviceWorker = null;
    this.isOnline = navigator.onLine;
    this.installPrompt = null;
    this.updateAvailable = false;

    this.initialize();
  }

  /**
   * Initialize PWA Manager
   * @private
   */
  async initialize() {
    try {
      // Register service worker
      await this.registerServiceWorker();

      // Setup connectivity monitoring
      this.setupConnectivityMonitoring();

      // Setup install prompt handling
      this.setupInstallPrompt();

      // Setup app lifecycle events
      this.setupAppLifecycle();

      console.log('📱 PWA Manager initialized');
    } catch (error) {
      console.error('❌ PWA Manager initialization failed:', error);
    }
  }

  /**
   * Register service worker
   * @private
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.serviceWorker = registration;

      console.log('✅ Service worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Check for existing update
      if (registration.waiting) {
        this.showUpdatePrompt();
      }

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'service-worker-registration',
        success: true,
      });
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      analytics.trackError(
        new ToneTrackerError(
          'Service worker registration failed',
          ERROR_CATEGORIES.SYSTEM,
          ERROR_LEVELS.ERROR,
          { originalError: error.message }
        )
      );
    }
  }

  /**
   * Handle service worker updates
   * @private
   */
  handleServiceWorkerUpdate(registration) {
    const newWorker = registration.installing;

    console.log('🔄 New service worker installing...');

    newWorker.addEventListener('statechange', () => {
      if (
        newWorker.state === 'installed' &&
        navigator.serviceWorker.controller
      ) {
        console.log('✨ New service worker ready!');
        this.updateAvailable = true;
        this.showUpdatePrompt();

        analytics.track(EVENT_TYPES.FEATURE_USED, {
          feature: 'service-worker-update',
          available: true,
        });
      }
    });
  }

  /**
   * Show update prompt to user
   * @private
   */
  showUpdatePrompt() {
    // Create update notification
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="update-banner">
        <div class="update-content">
          <span class="update-icon">🔄</span>
          <div class="update-text">
            <strong>App Update Available</strong>
            <p>A new version of ToneTracker is ready!</p>
          </div>
          <div class="update-actions">
            <button class="btn btn-primary btn-sm update-btn" onclick="window.pwaManager.applyUpdate()">
              Update Now
            </button>
            <button class="btn btn-secondary btn-sm dismiss-btn" onclick="this.closest('.pwa-update-notification').remove()">
              Later
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-update-notification {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(5px);
      }
      
      .update-banner {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      
      .update-content {
        display: flex;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
        gap: 16px;
      }
      
      .update-icon {
        font-size: 24px;
        animation: spin 2s linear infinite;
      }
      
      .update-text {
        flex: 1;
      }
      
      .update-text strong {
        display: block;
        margin-bottom: 4px;
      }
      
      .update-text p {
        margin: 0;
        opacity: 0.9;
        font-size: 14px;
      }
      
      .update-actions {
        display: flex;
        gap: 8px;
      }
      
      .update-btn, .dismiss-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .update-btn {
        background: white;
        color: #4f46e5;
      }
      
      .update-btn:hover {
        background: #f3f4f6;
        transform: translateY(-1px);
      }
      
      .dismiss-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .dismiss-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @media (max-width: 768px) {
        .update-content {
          flex-direction: column;
          text-align: center;
        }
        
        .update-actions {
          justify-content: center;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Auto-dismiss after 30 seconds if no action
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 30000);
  }

  /**
   * Apply service worker update
   */
  async applyUpdate() {
    if (this.serviceWorker && this.serviceWorker.waiting) {
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when new worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'service-worker-update-applied',
      });
    }
  }

  /**
   * Setup connectivity monitoring
   * @private
   */
  setupConnectivityMonitoring() {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      this.isOnline = true;
      this.hideOfflineIndicator();

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'connectivity-online',
      });
    });

    window.addEventListener('offline', () => {
      console.log('📡 Connection lost');
      this.isOnline = false;
      this.showOfflineIndicator();

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'connectivity-offline',
      });
    });

    // Initial state
    if (!this.isOnline) {
      this.showOfflineIndicator();
    }
  }

  /**
   * Show offline indicator
   * @private
   */
  showOfflineIndicator() {
    // Remove existing indicator
    this.hideOfflineIndicator();

    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #dc3545;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 9999;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      ">
        <span style="margin-right: 8px;">📡</span>
        You're offline - Some features may not work properly
      </div>
    `;

    document.body.appendChild(indicator);
  }

  /**
   * Hide offline indicator
   * @private
   */
  hideOfflineIndicator() {
    const indicator = document.querySelector('.offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Setup install prompt handling
   * @private
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 Install prompt available');
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallPrompt();

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'install-prompt-available',
      });
    });
  }

  /**
   * Show install prompt
   * @private
   */
  showInstallPrompt() {
    // Don't show if already installed or user dismissed recently
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (
      dismissed &&
      Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000
    ) {
      return; // Don't show for 7 days after dismissal
    }

    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 20px; margin-right: 8px;">📱</span>
          <strong>Install ToneTracker</strong>
        </div>
        <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">
          Install the app for a better experience!
        </p>
        <div style="display: flex; gap: 8px;">
          <button class="install-yes" style="
            background: white;
            color: #4f46e5;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            flex: 1;
          ">Install</button>
          <button class="install-no" style="
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">Not now</button>
        </div>
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(installBanner);

    // Add event listeners
    installBanner
      .querySelector('.install-yes')
      .addEventListener('click', () => {
        this.installApp();
        installBanner.remove();
      });

    installBanner.querySelector('.install-no').addEventListener('click', () => {
      localStorage.setItem('install-prompt-dismissed', Date.now().toString());
      installBanner.remove();

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'install-prompt-dismissed',
      });
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (installBanner.parentElement) {
        installBanner.remove();
      }
    }, 10000);
  }

  /**
   * Install the app
   */
  async installApp() {
    if (!this.installPrompt) return;

    try {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;

      console.log('📱 Install outcome:', outcome);

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'app-install-attempt',
        outcome: outcome,
      });

      this.installPrompt = null;
    } catch (error) {
      console.error('❌ Install failed:', error);
      analytics.trackError(
        new ToneTrackerError(
          'App installation failed',
          ERROR_CATEGORIES.SYSTEM,
          ERROR_LEVELS.ERROR,
          { originalError: error.message }
        )
      );
    }
  }

  /**
   * Setup app lifecycle events
   * @private
   */
  setupAppLifecycle() {
    // Track app installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ App installed successfully');

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'app-installed-success',
        timestamp: Date.now(),
      });
    });

    // Detect PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      console.log('📱 Running as PWA');
      document.documentElement.classList.add('pwa-mode');

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'pwa-mode-detected',
        displayMode: 'standalone',
      });
    }

    // Handle focus/blur for background sync
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppForeground();
      } else {
        this.handleAppBackground();
      }
    });
  }

  /**
   * Handle app coming to foreground
   * @private
   */
  handleAppForeground() {
    console.log('📱 App in foreground');

    // Check for updates
    if (this.serviceWorker) {
      this.serviceWorker.update();
    }

    analytics.track(EVENT_TYPES.FEATURE_USED, {
      feature: 'app-foreground',
    });
  }

  /**
   * Handle app going to background
   * @private
   */
  handleAppBackground() {
    console.log('📱 App in background');

    // Sync data
    this.syncInBackground();

    analytics.track(EVENT_TYPES.FEATURE_USED, {
      feature: 'app-background',
    });
  }

  /**
   * Sync data in background
   * @private
   */
  async syncInBackground() {
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('analytics-sync');
        console.log('📊 Background sync registered');
      } catch (error) {
        console.warn('⚠️ Background sync registration failed:', error);
      }
    }
  }

  /**
   * Get PWA status information
   * @returns {Object} PWA status
   */
  getStatus() {
    return {
      serviceWorkerRegistered: !!this.serviceWorker,
      isOnline: this.isOnline,
      canInstall: !!this.installPrompt,
      updateAvailable: this.updateAvailable,
      isStandalone:
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true,
    };
  }

  /**
   * Clear all app data and caches
   */
  async clearAppData() {
    try {
      // Clear caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // Clear local storage (keep user preferences)
      const keysToKeep = [
        'tonetracker_user_preferences',
        'tonetracker_user_id',
      ];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      console.log('🧹 App data cleared');

      analytics.track(EVENT_TYPES.FEATURE_USED, {
        feature: 'app-data-cleared',
      });
    } catch (error) {
      console.error('❌ Failed to clear app data:', error);
      throw error;
    }
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        console.log('💾 Persistent storage:', granted ? 'granted' : 'denied');

        analytics.track(EVENT_TYPES.FEATURE_USED, {
          feature: 'persistent-storage-request',
          granted: granted,
        });

        return granted;
      } catch (error) {
        console.error('❌ Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Make it globally available
window.pwaManager = pwaManager;
