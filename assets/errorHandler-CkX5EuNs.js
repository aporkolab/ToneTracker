/**
 * @fileoverview Advanced error handling and logging system
 * Provides centralized error management, logging, and user notification capabilities
 */

/**
 * Error severity levels
 * @readonly
 * @enum {string}
 */
export const ERROR_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * Error categories for better classification
 * @readonly
 * @enum {string}
 */
export const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  AUDIO: 'audio',
  GAME_LOGIC: 'game_logic',
  UI: 'ui',
  STORAGE: 'storage'
};

/**
 * Custom error class with additional context
 */
export class ToneTrackerError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} category - Error category
   * @param {string} level - Error severity level
   * @param {Object} context - Additional error context
   */
  constructor(message, category = ERROR_CATEGORIES.GAME_LOGIC, level = ERROR_LEVELS.ERROR, context = {}) {
    super(message);
    this.name = 'ToneTrackerError';
    this.category = category;
    this.level = level;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.stack = Error.captureStackTrace ? Error.captureStackTrace(this, ToneTrackerError) : this.stack;
  }
}

/**
 * Error logger with multiple output targets
 */
class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Keep only last 100 logs in memory
    this.isProduction = import.meta.env.MODE === 'production';
  }

  /**
   * Log an error with context
   * @param {Error|ToneTrackerError} error - The error to log
   * @param {Object} additionalContext - Additional context information
   */
  log(error, additionalContext = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      category: error.category || ERROR_CATEGORIES.GAME_LOGIC,
      level: error.level || ERROR_LEVELS.ERROR,
      context: { ...error.context, ...additionalContext },
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console logging based on level
    this.logToConsole(logEntry);

    // In production, you might want to send to external service
    if (this.isProduction) {
      this.logToExternalService(logEntry);
    }

    // Store critical errors locally
    if (logEntry.level === ERROR_LEVELS.FATAL || logEntry.level === ERROR_LEVELS.ERROR) {
      this.storeErrorLocally(logEntry);
    }
  }

  /**
   * Log to browser console
   * @private
   */
  logToConsole(logEntry) {
    const consoleMethod = {
      [ERROR_LEVELS.DEBUG]: 'debug',
      [ERROR_LEVELS.INFO]: 'info',
      [ERROR_LEVELS.WARN]: 'warn',
      [ERROR_LEVELS.ERROR]: 'error',
      [ERROR_LEVELS.FATAL]: 'error'
    }[logEntry.level] || 'log';

    console[consoleMethod](
      `[${logEntry.timestamp}] [${logEntry.category}] ${logEntry.message}`,
      logEntry.context,
      logEntry.stack
    );
  }

  /**
   * Store error in localStorage for later analysis
   * @private
   */
  storeErrorLocally(logEntry) {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('tonetracker_errors') || '[]');
      storedErrors.push(logEntry);
      
      // Keep only last 20 errors in storage
      if (storedErrors.length > 20) {
        storedErrors.splice(0, storedErrors.length - 20);
      }
      
      localStorage.setItem('tonetracker_errors', JSON.stringify(storedErrors));
    } catch (error) {
      console.warn('Failed to store error locally:', error);
    }
  }

  /**
   * Send error to external logging service (placeholder)
   * @private
   */
  logToExternalService(/* logEntry */) {
    // In a real application, you would send to services like Sentry, LogRocket, etc.
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // }).catch(() => {}); // Silent fail for logging
  }

  /**
   * Get recent logs for debugging
   * @param {number} count - Number of recent logs to return
   * @returns {Array} Recent log entries
   */
  getRecentLogs(count = 10) {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('tonetracker_errors');
  }
}

// Singleton instance
const logger = new ErrorLogger();

/**
 * Global error handler class
 */
export class ErrorHandler {
  constructor() {
    if (ErrorHandler.instance) {
      return ErrorHandler.instance;
    }
    
    this.logger = logger;
    this.setupGlobalHandlers();
    ErrorHandler.instance = this;
  }

  /**
   * Setup global error handlers
   * @private
   */
  setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new ToneTrackerError(
          `Unhandled Promise Rejection: ${event.reason}`,
          ERROR_CATEGORIES.GAME_LOGIC,
          ERROR_LEVELS.ERROR,
          { reason: event.reason }
        )
      );
    });

    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.handleError(
        new ToneTrackerError(
          `Uncaught Exception: ${event.message}`,
          ERROR_CATEGORIES.GAME_LOGIC,
          ERROR_LEVELS.ERROR,
          { 
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
          }
        )
      );
    });
  }

  /**
   * Handle and log an error
   * @param {Error|ToneTrackerError} error - The error to handle
   * @param {Object} context - Additional context
   * @param {boolean} showToUser - Whether to show error to user
   */
  handleError(error, context = {}, showToUser = true) {
    // Log the error
    this.logger.log(error, context);

    // Show user-friendly message if requested
    if (showToUser) {
      this.showUserError(error);
    }
  }

  /**
   * Show user-friendly error message
   * @private
   */
  showUserError(error) {
    const userMessage = this.getUserFriendlyMessage(error);
    
    // Create or update error notification
    let errorElement = document.getElementById('error-notification');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'error-notification';
      errorElement.className = 'error-notification';
      document.body.appendChild(errorElement);
    }

    errorElement.textContent = userMessage;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  /**
   * Convert technical error to user-friendly message
   * @private
   */
  getUserFriendlyMessage(error) {
    const messages = {
      [ERROR_CATEGORIES.VALIDATION]: 'Érvénytelen adat. Kérjük, ellenőrizze a bevitt értékeket.',
      [ERROR_CATEGORIES.NETWORK]: 'Hálózati hiba történt. Kérjük, próbálja újra később.',
      [ERROR_CATEGORIES.AUDIO]: 'Hang lejátszási hiba. Ellenőrizze a hang beállításokat.',
      [ERROR_CATEGORIES.GAME_LOGIC]: 'Hiba történt a játék során. A játék automatikusan újraindul.',
      [ERROR_CATEGORIES.UI]: 'Megjelenítési hiba történt. Kérjük, frissítse az oldalt.',
      [ERROR_CATEGORIES.STORAGE]: 'Adattárolási hiba. Ellenőrizze a böngésző beállításait.'
    };

    return messages[error.category] || 'Váratlan hiba történt. Kérjük, próbálja újra.';
  }

  /**
   * Create an async error wrapper function
   * @param {Function} asyncFn - Async function to wrap
   * @param {string} context - Context description
   * @returns {Function} Wrapped function
   */
  wrapAsync(asyncFn, context = 'async operation') {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        this.handleError(
          error instanceof ToneTrackerError 
            ? error 
            : new ToneTrackerError(
                `Error in ${context}: ${error.message}`,
                ERROR_CATEGORIES.GAME_LOGIC,
                ERROR_LEVELS.ERROR,
                { originalError: error.message, context }
              )
        );
        throw error;
      }
    };
  }

  /**
   * Create a sync error wrapper function
   * @param {Function} syncFn - Sync function to wrap
   * @param {string} context - Context description
   * @returns {Function} Wrapped function
   */
  wrapSync(syncFn, context = 'sync operation') {
    return (...args) => {
      try {
        return syncFn(...args);
      } catch (error) {
        this.handleError(
          error instanceof ToneTrackerError 
            ? error 
            : new ToneTrackerError(
                `Error in ${context}: ${error.message}`,
                ERROR_CATEGORIES.GAME_LOGIC,
                ERROR_LEVELS.ERROR,
                { originalError: error.message, context }
              )
        );
        throw error;
      }
    };
  }

  /**
   * Get error statistics for debugging
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const logs = this.logger.logs;
    const stats = {
      total: logs.length,
      byLevel: {},
      byCategory: {},
      recent: this.logger.getRecentLogs(5)
    };

    logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }
}

// Add static property
ErrorHandler.instance = null;

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions
export const logError = (error, context, showToUser) => errorHandler.handleError(error, context, showToUser);
export const wrapAsync = (fn, context) => errorHandler.wrapAsync(fn, context);
export const wrapSync = (fn, context) => errorHandler.wrapSync(fn, context);
