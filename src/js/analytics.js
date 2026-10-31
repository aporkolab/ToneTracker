/**
 * @fileoverview Analytics system for tracking user behavior and game performance
 * Privacy-focused analytics with local storage and optional external reporting
 */

// Error handling imports - commented out to avoid unused variable warnings
// import { ToneTrackerError, ERROR_CATEGORIES, ERROR_LEVELS } from './errorHandler.js';
import { storage } from './storage.js';

/**
 * Event types for analytics tracking
 * @readonly
 * @enum {string}
 */
export const EVENT_TYPES = {
  // Game events
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  GAME_WIN: 'game_win',
  GAME_LOSE: 'game_lose',
  COLOR_GUESS: 'color_guess',
  COMPUTER_TIP_USED: 'computer_tip_used',

  // UI events
  DIFFICULTY_CHANGE: 'difficulty_change',
  LANGUAGE_CHANGE: 'language_change',
  THEME_CHANGE: 'theme_change',
  SOUND_TOGGLE: 'sound_toggle',

  // User journey
  PAGE_VIEW: 'page_view',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  FEATURE_USED: 'feature_used',
  ERROR_OCCURRED: 'error_occurred',

  // Performance
  LOAD_TIME: 'load_time',
  RENDER_TIME: 'render_time',
  PERFORMANCE_ISSUE: 'performance_issue',

  // Accessibility
  ACCESSIBILITY_FEATURE_USED: 'accessibility_feature_used',
  KEYBOARD_NAVIGATION: 'keyboard_navigation',
  SCREEN_READER_DETECTED: 'screen_reader_detected',
};

/**
 * Event categories for grouping
 * @readonly
 * @enum {string}
 */
export const EVENT_CATEGORIES = {
  GAME: 'game',
  UI: 'ui',
  PERFORMANCE: 'performance',
  ERROR: 'error',
  USER_JOURNEY: 'user_journey',
  ACCESSIBILITY: 'accessibility',
};

/**
 * Analytics configuration
 */
const ANALYTICS_CONFIG = {
  maxEvents: 1000, // Maximum events to store locally
  batchSize: 50, // Events to send in each batch
  flushInterval: 30000, // 30 seconds
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  enableConsoleLogging: true, // Log events to console in development
  enableLocalStorage: true, // Store events locally
  enableExternalReporting: false, // Send to external analytics service
  privacyMode: true, // Enhanced privacy protection

  // External service configuration (placeholder)
  externalService: {
    endpoint: null,
    apiKey: null,
    enabled: false,
  },
};

/**
 * Analytics class for tracking events and user behavior
 */
export class Analytics {
  constructor(config = {}) {
    this.config = { ...ANALYTICS_CONFIG, ...config };
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.lastActivity = Date.now();
    this.batchTimer = null;
    this.isEnabled = true;
    this.userId = this.getUserId();

    // Device and environment detection
    this.deviceInfo = this.collectDeviceInfo();

    // Initialize session
    this.initializeSession();

    // Setup automatic flushing
    this.setupAutoFlush();

    // Setup page visibility handling
    this.setupVisibilityHandling();

    // Load stored events
    this.loadStoredEvents();
  }

  /**
   * Generate a unique session ID
   * @private
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create a user ID (anonymous)
   * @private
   * @returns {string} Anonymous user ID
   */
  getUserId() {
    let userId = storage.get('tonetracker_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      storage.set('tonetracker_user_id', userId);
    }
    return userId;
  }

  /**
   * Collect device and environment information
   * @private
   * @returns {Object} Device information
   */
  collectDeviceInfo() {
    const nav = navigator;
    const screen = window.screen;

    return {
      userAgent: this.config.privacyMode
        ? this.hashString(nav.userAgent)
        : nav.userAgent,
      language: nav.language,
      languages: nav.languages,
      platform: nav.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      cookieEnabled: nav.cookieEnabled,
      onlineStatus: nav.onLine,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Privacy-aware feature detection
      features: {
        localStorage: this.isLocalStorageAvailable(),
        webgl: this.isWebGLAvailable(),
        webAudio: this.isWebAudioAvailable(),
        gamepads: 'getGamepads' in nav,
        geolocation: 'geolocation' in nav,
        notifications: 'Notification' in window,
        serviceWorker: 'serviceWorker' in nav,
      },
    };
  }

  /**
   * Hash sensitive strings for privacy
   * @private
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Feature detection methods
   * @private
   */
  isLocalStorageAvailable() {
    try {
      return typeof Storage !== 'undefined';
    } catch {
      return false;
    }
  }

  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch {
      return false;
    }
  }

  isWebAudioAvailable() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Initialize session tracking
   * @private
   */
  initializeSession() {
    this.track(EVENT_TYPES.SESSION_START, {
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo,
      timestamp: this.sessionStart,
    });
  }

  /**
   * Setup automatic event flushing
   * @private
   */
  setupAutoFlush() {
    if (this.config.flushInterval > 0) {
      this.batchTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  /**
   * Setup page visibility handling
   * @private
   */
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track(EVENT_TYPES.SESSION_END, {
          sessionDuration: Date.now() - this.sessionStart,
          eventsTracked: this.events.length,
        });
        this.flush();
      } else {
        this.updateActivity();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.track(EVENT_TYPES.SESSION_END, {
        sessionDuration: Date.now() - this.sessionStart,
        eventsTracked: this.events.length,
      });
      this.flush(true); // Force immediate flush
    });
  }

  /**
   * Load stored events from previous sessions
   * @private
   */
  loadStoredEvents() {
    if (this.config.enableLocalStorage) {
      try {
        const stored = storage.get('tonetracker_analytics_events', []);
        if (Array.isArray(stored)) {
          this.events = stored.slice(-this.config.maxEvents);
        }
      } catch (error) {
        console.warn('Failed to load stored analytics events:', error);
      }
    }
  }

  /**
   * Update last activity timestamp
   * @private
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Check if session is still active
   * @private
   * @returns {boolean} Whether session is active
   */
  isSessionActive() {
    return Date.now() - this.lastActivity < this.config.sessionTimeout;
  }

  /**
   * Track an event
   * @param {string} eventType - Type of event
   * @param {Object} properties - Event properties
   * @param {string} category - Event category
   */
  track(eventType, properties = {}, category = null) {
    if (!this.isEnabled) return;

    this.updateActivity();

    const event = {
      id: this.generateEventId(),
      type: eventType,
      category: category || this.getCategoryForEvent(eventType),
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: this.config.privacyMode ? 'redacted' : navigator.userAgent,
        language: navigator.language,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      createdAt: new Date().toISOString(),
    };

    // Add to events array
    this.events.push(event);

    // Limit stored events
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // Console logging for development
    if (this.config.enableConsoleLogging && !this.config.privacyMode) {
      console.log('📊 Analytics Event:', eventType, properties);
    }

    // Store locally if enabled
    if (this.config.enableLocalStorage) {
      this.storeEvents();
    }

    // Auto-flush if batch is full
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Generate unique event ID
   * @private
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get category for event type
   * @private
   */
  getCategoryForEvent(eventType) {
    const gameEvents = [
      EVENT_TYPES.GAME_START,
      EVENT_TYPES.GAME_END,
      EVENT_TYPES.GAME_WIN,
      EVENT_TYPES.GAME_LOSE,
      EVENT_TYPES.COLOR_GUESS,
      EVENT_TYPES.COMPUTER_TIP_USED,
    ];

    const uiEvents = [
      EVENT_TYPES.DIFFICULTY_CHANGE,
      EVENT_TYPES.LANGUAGE_CHANGE,
      EVENT_TYPES.THEME_CHANGE,
      EVENT_TYPES.SOUND_TOGGLE,
    ];

    const performanceEvents = [EVENT_TYPES.LOAD_TIME, EVENT_TYPES.RENDER_TIME];

    const accessibilityEvents = [
      EVENT_TYPES.ACCESSIBILITY_FEATURE_USED,
      EVENT_TYPES.KEYBOARD_NAVIGATION,
      EVENT_TYPES.SCREEN_READER_DETECTED,
    ];

    if (gameEvents.includes(eventType)) return EVENT_CATEGORIES.GAME;
    if (uiEvents.includes(eventType)) return EVENT_CATEGORIES.UI;
    if (performanceEvents.includes(eventType))
      return EVENT_CATEGORIES.PERFORMANCE;
    if (accessibilityEvents.includes(eventType))
      return EVENT_CATEGORIES.ACCESSIBILITY;
    if (eventType === EVENT_TYPES.ERROR_OCCURRED) return EVENT_CATEGORIES.ERROR;

    return EVENT_CATEGORIES.USER_JOURNEY;
  }

  /**
   * Store events to localStorage
   * @private
   */
  storeEvents() {
    try {
      storage.set('tonetracker_analytics_events', this.events);
    } catch (error) {
      console.warn('Failed to store analytics events:', error);
    }
  }

  /**
   * Flush events to external service or storage
   * @param {boolean} force - Force immediate flush
   */
  async flush(force = false) {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];

    try {
      if (
        this.config.enableExternalReporting &&
        this.config.externalService.enabled
      ) {
        await this.sendToExternalService(eventsToFlush);
      }

      // Store summary statistics locally
      this.updateAnalyticsSummary(eventsToFlush);

      // Clear sent events
      this.events = [];

      if (this.config.enableLocalStorage) {
        this.storeEvents();
      }
    } catch (error) {
      console.warn('Failed to flush analytics events:', error);

      // On error, keep events for retry
      if (!force) {
        return;
      }
    }
  }

  /**
   * Send events to external analytics service
   * @private
   */
  async sendToExternalService(events) {
    const { endpoint, apiKey } = this.config.externalService;

    if (!endpoint) {
      console.warn('External analytics endpoint not configured');
      return;
    }

    const payload = {
      events: events,
      metadata: {
        source: 'ToneTracker',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analytics service error: ${response.status}`);
    }
  }

  /**
   * Update analytics summary statistics
   * @private
   */
  updateAnalyticsSummary(events) {
    try {
      const summary = storage.get('tonetracker_analytics_summary', {
        totalEvents: 0,
        eventCounts: {},
        lastUpdated: null,
        sessions: [],
      });

      summary.totalEvents += events.length;
      summary.lastUpdated = new Date().toISOString();

      // Count events by type
      events.forEach((event) => {
        summary.eventCounts[event.type] =
          (summary.eventCounts[event.type] || 0) + 1;
      });

      // Track session info
      const sessionEvents = events.filter(
        (e) => e.type === EVENT_TYPES.SESSION_START
      );
      sessionEvents.forEach((event) => {
        summary.sessions.push({
          sessionId: event.properties.sessionId,
          startTime: event.createdAt,
          deviceInfo: event.properties.deviceInfo,
        });
      });

      // Keep only recent sessions (last 100)
      if (summary.sessions.length > 100) {
        summary.sessions = summary.sessions.slice(-100);
      }

      storage.set('tonetracker_analytics_summary', summary);
    } catch (error) {
      console.warn('Failed to update analytics summary:', error);
    }
  }

  /**
   * Track game-specific events with convenience methods
   */
  trackGameStart(difficulty, targetColor) {
    this.track(EVENT_TYPES.GAME_START, {
      difficulty,
      targetColor: this.config.privacyMode ? 'redacted' : targetColor,
      gameId: this.generateEventId(),
    });
  }

  trackGameEnd(won, score, time, difficulty, accuracy) {
    this.track(won ? EVENT_TYPES.GAME_WIN : EVENT_TYPES.GAME_LOSE, {
      won,
      score,
      time,
      difficulty,
      accuracy,
      performance: this.calculatePerformanceMetrics(score, time, accuracy),
    });
  }

  trackColorGuess(userGuess, targetColor, accuracy, isCorrect) {
    this.track(EVENT_TYPES.COLOR_GUESS, {
      userGuess: this.config.privacyMode ? 'redacted' : userGuess,
      targetColor: this.config.privacyMode ? 'redacted' : targetColor,
      accuracy,
      isCorrect,
      deltaE: this.calculateDeltaE(userGuess, targetColor),
    });
  }

  trackFeatureUsage(feature, context = {}) {
    this.track(EVENT_TYPES.FEATURE_USED, {
      feature,
      ...context,
    });
  }

  trackError(error, context = {}) {
    this.track(EVENT_TYPES.ERROR_OCCURRED, {
      message: error.message,
      category: error.category || 'unknown',
      level: error.level || 'error',
      stack: this.config.privacyMode ? 'redacted' : error.stack,
      ...context,
    });
  }

  trackPerformance(metric, value, context = {}) {
    this.track(EVENT_TYPES.RENDER_TIME, {
      metric,
      value,
      unit: 'ms',
      ...context,
    });
  }

  /**
   * Calculate performance metrics
   * @private
   */
  calculatePerformanceMetrics(score, time, accuracy) {
    return {
      scorePerSecond: time > 0 ? score / (time / 1000) : 0,
      efficiency: accuracy > 0 ? score / accuracy : 0,
      timeCategory: this.categorizeTime(time),
    };
  }

  /**
   * Categorize time performance
   * @private
   */
  categorizeTime(time) {
    if (time < 10000) return 'fast';
    if (time < 30000) return 'medium';
    if (time < 60000) return 'slow';
    return 'very_slow';
  }

  /**
   * Calculate Delta E (color difference)
   * @private
   */
  calculateDeltaE(color1, color2) {
    // Simplified Delta E calculation for analytics
    // In a real implementation, you'd use the proper Lab color space conversion
    try {
      const hex1 = color1.replace('#', '');
      const hex2 = color2.replace('#', '');

      const r1 = parseInt(hex1.substr(0, 2), 16);
      const g1 = parseInt(hex1.substr(2, 2), 16);
      const b1 = parseInt(hex1.substr(4, 2), 16);

      const r2 = parseInt(hex2.substr(0, 2), 16);
      const g2 = parseInt(hex2.substr(2, 2), 16);
      const b2 = parseInt(hex2.substr(4, 2), 16);

      return Math.sqrt(
        Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
      );
    } catch {
      return 0;
    }
  }

  /**
   * Get analytics summary
   * @returns {Object} Analytics summary
   */
  getAnalyticsSummary() {
    const stored = storage.get('tonetracker_analytics_summary', {});
    return {
      ...stored,
      currentSession: {
        id: this.sessionId,
        startTime: this.sessionStart,
        duration: Date.now() - this.sessionStart,
        eventsCount: this.events.length,
        isActive: this.isSessionActive(),
      },
    };
  }

  /**
   * Enable or disable analytics
   * @param {boolean} enabled - Whether to enable analytics
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.flush(true);
      this.clearEvents();
    }
  }

  /**
   * Clear all stored events
   */
  clearEvents() {
    this.events = [];
    if (this.config.enableLocalStorage) {
      storage.remove('tonetracker_analytics_events');
      storage.remove('tonetracker_analytics_summary');
    }
  }

  /**
   * Cleanup analytics instance
   */
  destroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flush(true);
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Convenience functions
export const trackEvent = (type, properties, category) =>
  analytics.track(type, properties, category);
export const trackGameStart = (difficulty, color) =>
  analytics.trackGameStart(difficulty, color);
export const trackGameEnd = (won, score, time, difficulty, accuracy) =>
  analytics.trackGameEnd(won, score, time, difficulty, accuracy);
export const trackError = (error, context) =>
  analytics.trackError(error, context);
export const trackFeature = (feature, context) =>
  analytics.trackFeatureUsage(feature, context);
