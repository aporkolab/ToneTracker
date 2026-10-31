/**
 * @fileoverview Local storage manager for game data persistence
 * Provides type-safe localStorage operations with data validation and migration support
 */

import {
  ToneTrackerError,
  ERROR_CATEGORIES,
  ERROR_LEVELS,
} from './errorHandler.js';

/**
 * Storage keys used throughout the application
 * @readonly
 * @enum {string}
 */
export const STORAGE_KEYS = {
  GAME_STATISTICS: 'tonetracker_game_stats',
  USER_PREFERENCES: 'tonetracker_user_prefs',
  HIGH_SCORES: 'tonetracker_high_scores',
  GAME_HISTORY: 'tonetracker_game_history',
  SETTINGS: 'tonetracker_settings',
  LOCALE: 'tonetracker_locale',
  ERRORS: 'tonetracker_errors',
};

/**
 * Current data schema version for migration purposes
 */
const SCHEMA_VERSION = 1;

/**
 * Default game statistics structure
 */
const DEFAULT_GAME_STATISTICS = {
  version: SCHEMA_VERSION,
  totalGames: 0,
  gamesWon: 0,
  gamesLost: 0,
  totalScore: 0,
  bestScore: 0,
  averageScore: 0,
  totalTimeSpent: 0, // in seconds
  averageTime: 0,
  bestTime: null,
  currentStreak: 0,
  bestStreak: 0,
  difficultyCounts: {
    easy: { played: 0, won: 0, totalScore: 0 },
    medium: { played: 0, won: 0, totalScore: 0 },
    hard: { played: 0, won: 0, totalScore: 0 },
  },
  colorAccuracyHistory: [], // Last 50 accuracy percentages
  sessionStats: {
    startTime: null,
    gamesPlayed: 0,
    gamesWon: 0,
  },
  achievements: [],
  lastPlayed: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Default user preferences structure
 */
const DEFAULT_USER_PREFERENCES = {
  version: SCHEMA_VERSION,
  difficulty: 'easy',
  soundEnabled: true,
  animationsEnabled: true,
  showPercentageFeedback: true,
  showTimer: true,
  colorFormat: 'hex', // 'hex', 'rgb', 'hsl'
  theme: 'light', // 'light', 'dark', 'auto'
  autoStartNextGame: false,
  showHints: true,
  preferredLanguage: 'hu',
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    screenReaderMode: false,
    largerText: false,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Default high scores structure
 */
const DEFAULT_HIGH_SCORES = {
  version: SCHEMA_VERSION,
  scores: [], // Array of {score, time, difficulty, date, accuracy}
  maxScores: 100, // Keep only top 100 scores
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Storage manager class for handling localStorage operations
 */
export class StorageManager {
  constructor() {
    this.isSupported = this.checkStorageSupport();
    this.cache = new Map();
    this.listeners = new Map();

    if (this.isSupported) {
      this.migrateData();
    }
  }

  /**
   * Check if localStorage is supported and available
   * @private
   * @returns {boolean} Whether localStorage is supported
   */
  checkStorageSupport() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage is not available:', error);
      return false;
    }
  }

  /**
   * Migrate data from older versions if needed
   * @private
   */
  migrateData() {
    try {
      // Check if migration is needed for each data type
      const stats = this.getRaw(STORAGE_KEYS.GAME_STATISTICS);
      if (stats && (!stats.version || stats.version < SCHEMA_VERSION)) {
        this.migrateGameStatistics(stats);
      }

      const prefs = this.getRaw(STORAGE_KEYS.USER_PREFERENCES);
      if (prefs && (!prefs.version || prefs.version < SCHEMA_VERSION)) {
        this.migrateUserPreferences(prefs);
      }

      const scores = this.getRaw(STORAGE_KEYS.HIGH_SCORES);
      if (scores && (!scores.version || scores.version < SCHEMA_VERSION)) {
        this.migrateHighScores(scores);
      }
    } catch (error) {
      console.warn('Data migration failed:', error);
    }
  }

  /**
   * Migrate game statistics to current version
   * @private
   */
  migrateGameStatistics(oldStats) {
    const newStats = {
      ...structuredClone(DEFAULT_GAME_STATISTICS),
      ...oldStats,
    };
    newStats.version = SCHEMA_VERSION;
    newStats.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.GAME_STATISTICS, newStats);
  }

  /**
   * Migrate user preferences to current version
   * @private
   */
  migrateUserPreferences(oldPrefs) {
    const newPrefs = {
      ...structuredClone(DEFAULT_USER_PREFERENCES),
      ...oldPrefs,
    };
    newPrefs.version = SCHEMA_VERSION;
    newPrefs.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.USER_PREFERENCES, newPrefs);
  }

  /**
   * Migrate high scores to current version
   * @private
   */
  migrateHighScores(oldScores) {
    const newScores = { ...structuredClone(DEFAULT_HIGH_SCORES), ...oldScores };
    newScores.version = SCHEMA_VERSION;
    newScores.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.HIGH_SCORES, newScores);
  }

  /**
   * Get raw data from localStorage without parsing
   * @private
   */
  getRaw(key) {
    if (!this.isSupported) return null;

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Failed to get raw data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    if (!this.isSupported) {
      console.warn('LocalStorage not supported, data not saved');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);

      // Update cache
      this.cache.set(key, value);

      // Notify listeners
      this.notifyListeners(key, value);

      return true;
    } catch (error) {
      throw new ToneTrackerError(
        `Failed to save data to localStorage: ${error.message}`,
        ERROR_CATEGORIES.STORAGE,
        ERROR_LEVELS.ERROR,
        { key, error: error.message }
      );
    }
  }

  /**
   * Get data from localStorage with fallback to default
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Retrieved value or default
   */
  get(key, defaultValue = null) {
    if (!this.isSupported) {
      return defaultValue;
    }

    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const data = localStorage.getItem(key);
      if (data === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(data);

      // Update cache
      this.cache.set(key, parsed);

      return parsed;
    } catch (error) {
      console.warn(`Failed to get data for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    if (!this.isSupported) return;

    try {
      localStorage.removeItem(key);
      this.cache.delete(key);
      this.notifyListeners(key, null);
    } catch (error) {
      console.warn(`Failed to remove key ${key}:`, error);
    }
  }

  /**
   * Clear all ToneTracker data from localStorage
   */
  clear() {
    if (!this.isSupported) return;

    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
        this.cache.delete(key);
      });
      console.log('All ToneTracker data cleared from localStorage');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * Get game statistics
   * @returns {Object} Game statistics
   */
  getGameStatistics() {
    return this.get(
      STORAGE_KEYS.GAME_STATISTICS,
      structuredClone(DEFAULT_GAME_STATISTICS)
    );
  }

  /**
   * Update game statistics
   * @param {Object} updates - Statistics updates
   */
  updateGameStatistics(updates) {
    const current = this.getGameStatistics();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate derived values
    if ('totalGames' in updates || 'totalScore' in updates) {
      updated.averageScore =
        updated.totalGames > 0
          ? Math.round(updated.totalScore / updated.totalGames)
          : 0;
    }

    this.set(STORAGE_KEYS.GAME_STATISTICS, updated);
    return updated;
  }

  /**
   * Record a completed game
   * @param {Object} gameResult - Game result data
   */
  recordGame(gameResult) {
    const { won, score, time, difficulty, accuracy, targetColor, userGuess } =
      gameResult;

    const stats = this.getGameStatistics();

    // Update basic stats
    stats.totalGames += 1;
    stats.totalTimeSpent += time;
    stats.averageTime = Math.round(stats.totalTimeSpent / stats.totalGames);

    if (won) {
      stats.gamesWon += 1;
      stats.totalScore += score;
      stats.currentStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);

      if (score > stats.bestScore) {
        stats.bestScore = score;
      }

      if (!stats.bestTime || time < stats.bestTime) {
        stats.bestTime = time;
      }
    } else {
      stats.gamesLost += 1;
      stats.currentStreak = 0;
    }

    // Update difficulty-specific stats
    if (stats.difficultyCounts[difficulty]) {
      stats.difficultyCounts[difficulty].played += 1;
      if (won) {
        stats.difficultyCounts[difficulty].won += 1;
        stats.difficultyCounts[difficulty].totalScore += score;
      }
    }

    // Update accuracy history (keep last 50)
    if (accuracy !== undefined) {
      stats.colorAccuracyHistory.push(accuracy);
      if (stats.colorAccuracyHistory.length > 50) {
        stats.colorAccuracyHistory.shift();
      }
    }

    // Update session stats
    if (!stats.sessionStats.startTime) {
      stats.sessionStats.startTime = new Date().toISOString();
    }
    stats.sessionStats.gamesPlayed += 1;
    if (won) {
      stats.sessionStats.gamesWon += 1;
    }

    // Update derived values
    stats.averageScore =
      stats.gamesWon > 0 ? Math.round(stats.totalScore / stats.gamesWon) : 0;

    stats.lastPlayed = new Date().toISOString();
    stats.updatedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.GAME_STATISTICS, stats);

    // Also record high score if applicable
    if (won && score > 0) {
      this.addHighScore({
        score,
        time,
        difficulty,
        accuracy,
        date: new Date().toISOString(),
        targetColor,
        userGuess,
      });
    }

    return stats;
  }

  /**
   * Get user preferences
   * @returns {Object} User preferences
   */
  getUserPreferences() {
    return this.get(
      STORAGE_KEYS.USER_PREFERENCES,
      structuredClone(DEFAULT_USER_PREFERENCES)
    );
  }

  /**
   * Update user preferences
   * @param {Object} updates - Preference updates
   */
  updateUserPreferences(updates) {
    const current = this.getUserPreferences();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.USER_PREFERENCES, updated);
    return updated;
  }

  /**
   * Get high scores
   * @returns {Object} High scores data
   */
  getHighScores() {
    return this.get(
      STORAGE_KEYS.HIGH_SCORES,
      structuredClone(DEFAULT_HIGH_SCORES)
    );
  }

  /**
   * Add a new high score
   * @param {Object} scoreData - Score data
   */
  addHighScore(scoreData) {
    const highScores = this.getHighScores();

    highScores.scores.push({
      ...scoreData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });

    // Sort by score descending, then by time ascending
    highScores.scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time - b.time;
    });

    // Keep only top scores
    if (highScores.scores.length > highScores.maxScores) {
      highScores.scores = highScores.scores.slice(0, highScores.maxScores);
    }

    highScores.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.HIGH_SCORES, highScores);

    return highScores;
  }

  /**
   * Get top scores for a specific difficulty
   * @param {string} difficulty - Difficulty level
   * @param {number} limit - Maximum number of scores to return
   * @returns {Array} Top scores
   */
  getTopScores(difficulty = null, limit = 10) {
    const highScores = this.getHighScores();
    let scores = highScores.scores;

    if (difficulty) {
      scores = scores.filter((score) => score.difficulty === difficulty);
    }

    return scores.slice(0, limit);
  }

  /**
   * Subscribe to storage changes
   * @param {string} key - Storage key to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notify listeners of storage changes
   * @private
   */
  notifyListeners(key, value) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((callback) => {
        try {
          callback(value, key);
        } catch (error) {
          console.warn('Storage listener callback failed:', error);
        }
      });
    }
  }

  /**
   * Export all data for backup
   * @returns {Object} All stored data
   */
  exportData() {
    const data = {};

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this.get(key);
    });

    data.exportedAt = new Date().toISOString();
    data.version = SCHEMA_VERSION;

    return data;
  }

  /**
   * Import data from backup
   * @param {Object} data - Data to import
   * @param {boolean} merge - Whether to merge with existing data
   */
  importData(data, merge = false) {
    if (!data || typeof data !== 'object') {
      throw new ToneTrackerError(
        'Invalid data format for import',
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR
      );
    }

    try {
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name]) {
          if (merge) {
            const existing = this.get(key);
            if (existing && typeof existing === 'object') {
              this.set(key, { ...existing, ...data[name] });
            } else {
              this.set(key, data[name]);
            }
          } else {
            this.set(key, data[name]);
          }
        }
      });

      console.log('Data import completed successfully');
    } catch (error) {
      throw new ToneTrackerError(
        `Data import failed: ${error.message}`,
        ERROR_CATEGORIES.STORAGE,
        ERROR_LEVELS.ERROR,
        { error: error.message }
      );
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getStorageInfo() {
    if (!this.isSupported) {
      return { supported: false };
    }

    let totalSize = 0;
    const keyData = {};

    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        const data = localStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        totalSize += size;
        keyData[key] = {
          exists: !!data,
          size: size,
          sizeFormatted: this.formatBytes(size),
        };
      } catch (error) {
        keyData[key] = { error: error.message };
      }
    });

    return {
      supported: true,
      totalSize: totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      keys: keyData,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Format bytes to human readable format
   * @private
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const storage = new StorageManager();
