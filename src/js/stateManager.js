/**
 * @fileoverview Advanced immutable state management with validation, history and pub/sub pattern
 * Provides reactive state management with time-travel debugging capabilities
 */

import {
  ToneTrackerError,
  ERROR_CATEGORIES,
  ERROR_LEVELS,
  logError,
} from './errorHandler.js';

/**
 * Deep freeze object to ensure immutability
 * @param {Object} obj - Object to freeze
 * @returns {Object} Deeply frozen object
 */
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach((name) => {
    const prop = obj[name];
    if (typeof prop === 'object' && prop !== null) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}

/**
 * Deep clone object to create new instances
 * @param {*} obj - Object to clone
 * @returns {*} Deep cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(deepClone);
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Validate state structure and types
 * @param {Object} state - State to validate
 * @throws {ToneTrackerError} When state is invalid
 */
function validateState(state) {
  const requiredFields = ['game', 'ui', 'user', 'system', 'history'];

  for (const field of requiredFields) {
    if (!(field in state)) {
      throw new ToneTrackerError(
        `Missing required state field: ${field}`,
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR,
        { field, state }
      );
    }
  }

  // Validate game state
  if (typeof state.game !== 'object') {
    throw new ToneTrackerError(
      'game state must be an object',
      ERROR_CATEGORIES.VALIDATION
    );
  }

  // Validate specific types
  const gameValidation = {
    generatedColor: (val) => val === null || typeof val === 'string',
    score: (val) => typeof val === 'number' && val >= 0,
    tipCount: (val) => typeof val === 'number' && val >= 0,
    computerTipCount: (val) => typeof val === 'number' && val >= 0,
    isActive: (val) => typeof val === 'boolean',
    difficulty: (val) => ['easy', 'medium', 'hard'].includes(val),
    startTime: (val) =>
      val === null || val instanceof Date || typeof val === 'number',
  };

  for (const [field, validator] of Object.entries(gameValidation)) {
    if (field in state.game && !validator(state.game[field])) {
      throw new ToneTrackerError(
        `Invalid game.${field} value: ${state.game[field]}`,
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR,
        { field, value: state.game[field] }
      );
    }
  }
}

/**
 * Initial application state
 */
const initialState = deepFreeze({
  game: {
    generatedColor: null,
    startTime: null,
    score: 0,
    tipCount: 0,
    computerTipCount: 0,
    isActive: false,
    difficulty: 'easy',
    round: 0,
    streak: 0,
    bestStreak: 0,
    totalGamesPlayed: 0,
    correctGuesses: 0,
    averageTime: 0,
  },
  ui: {
    theme: 'dark',
    soundEnabled: true,
    showHints: true,
    animationsEnabled: true,
    currentModal: null,
    feedback: {
      message: '',
      type: 'info', // 'info', 'success', 'warning', 'error'
      visible: false,
    },
    loading: {
      isLoading: false,
      message: '',
    },
  },
  user: {
    preferences: {
      preferredDifficulty: 'easy',
      colorFormat: 'hex', // 'hex', 'rgb', 'hsl'
      autoStartNext: false,
      showPercentage: true,
    },
    statistics: {
      gamesPlayed: 0,
      gamesWon: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      favoriteColors: [],
    },
  },
  system: {
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    performance: {
      renderTime: 0,
      stateUpdateTime: 0,
      memoryUsage: 0,
    },
    errors: [],
  },
  history: {
    states: [],
    currentIndex: -1,
    maxHistory: 50,
  },
});

/**
 * Advanced State Manager with immutability and validation
 */
export class StateManager {
  constructor() {
    this._state = deepClone(initialState);
    this._subscribers = new Map();
    this._middlewares = [];
    this._actionHistory = [];
    this._isReplaying = false;

    // Validate initial state
    validateState(this._state);

    // Add to history
    this._addToHistory(this._state, { type: 'INIT' });
  }

  /**
   * Get current state (deeply frozen for immutability)
   * @returns {Object} Current application state
   */
  getState() {
    return deepFreeze(deepClone(this._state));
  }

  /**
   * Subscribe to state changes
   * @param {string} path - State path to watch (e.g., 'game.score' or '*' for all)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (typeof callback !== 'function') {
      throw new ToneTrackerError(
        'Callback must be a function',
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR,
        { path, callback: typeof callback }
      );
    }

    const id = Symbol('subscription');

    if (!this._subscribers.has(path)) {
      this._subscribers.set(path, new Map());
    }

    this._subscribers.get(path).set(id, callback);

    // Return unsubscribe function
    return () => {
      const pathSubscribers = this._subscribers.get(path);
      if (pathSubscribers) {
        pathSubscribers.delete(id);
        if (pathSubscribers.size === 0) {
          this._subscribers.delete(path);
        }
      }
    };
  }

  /**
   * Dispatch action to update state
   * @param {Object} action - Action object with type and payload
   * @returns {Object} New state
   */
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new ToneTrackerError(
        'Action must have a type string',
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR,
        { action }
      );
    }

    const startTime = performance.now();

    try {
      // Run middlewares
      let processedAction = action;
      for (const middleware of this._middlewares) {
        processedAction = middleware(processedAction, this._state);
      }

      const newState = this._reducer(this._state, processedAction);

      // Validate new state
      validateState(newState);

      // Update state
      const previousState = this._state;
      this._state = newState;

      // Add to history (unless replaying)
      if (!this._isReplaying) {
        this._addToHistory(newState, processedAction);
        this._actionHistory.push({
          action: processedAction,
          timestamp: new Date().toISOString(),
          executionTime: performance.now() - startTime,
        });
      }

      // Update performance metrics
      this._state.system.performance.stateUpdateTime =
        performance.now() - startTime;

      // Notify subscribers
      this._notifySubscribers(previousState, newState, processedAction);

      return this.getState();
    } catch (error) {
      logError(
        new ToneTrackerError(
          `State update failed: ${error.message}`,
          ERROR_CATEGORIES.GAME_LOGIC,
          ERROR_LEVELS.ERROR,
          { action, error: error.message }
        ),
        { action },
        false
      );
      throw error;
    }
  }

  /**
   * Add middleware to processing chain
   * @param {Function} middleware - Middleware function
   */
  addMiddleware(middleware) {
    if (typeof middleware !== 'function') {
      throw new ToneTrackerError(
        'Middleware must be a function',
        ERROR_CATEGORIES.VALIDATION
      );
    }
    this._middlewares.push(middleware);
  }

  /**
   * Time travel: go to specific state in history
   * @param {number} index - History index
   */
  timeTravel(index) {
    if (index < 0 || index >= this._state.history.states.length) {
      throw new ToneTrackerError(
        `Invalid history index: ${index}`,
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR,
        { index, historyLength: this._state.history.states.length }
      );
    }

    this._isReplaying = true;
    const targetState = this._state.history.states[index];
    const previousState = this._state;

    this._state = deepClone(targetState.state);
    this._state.history.currentIndex = index;

    this._notifySubscribers(previousState, this._state, {
      type: 'TIME_TRAVEL',
      payload: { index },
    });
    this._isReplaying = false;
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance data
   */
  getPerformanceMetrics() {
    return {
      ...this._state.system.performance,
      actionHistory: this._actionHistory.slice(-10), // Last 10 actions
      subscriberCount: Array.from(this._subscribers.values()).reduce(
        (total, pathSubs) => total + pathSubs.size,
        0
      ),
      historySize: this._state.history.states.length,
    };
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.dispatch({ type: 'RESET_STATE' });
  }

  /**
   * Export state for persistence
   * @returns {string} JSON string of serializable state
   */
  exportState() {
    const exportData = {
      ...this._state,
      system: {
        ...this._state.system,
        exportedAt: new Date().toISOString(),
      },
    };

    return JSON.stringify(exportData, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
  }

  /**
   * Import state from persistence
   * @param {string} stateJson - JSON string of state
   */
  importState(stateJson) {
    try {
      const importedState = JSON.parse(stateJson, (key, value) => {
        if (value && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });

      validateState(importedState);
      this._state = importedState;
      this._addToHistory(this._state, { type: 'IMPORT_STATE' });
    } catch (error) {
      throw new ToneTrackerError(
        `Failed to import state: ${error.message}`,
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR,
        { error: error.message }
      );
    }
  }

  /**
   * Main reducer function
   * @private
   */
  _reducer(state, action) {
    const newState = deepClone(state);

    switch (action.type) {
      case 'RESET_STATE':
        return deepClone(initialState);

      case 'SET_GAME_FIELD':
        if (!action.payload || typeof action.payload.field !== 'string') {
          throw new ToneTrackerError(
            'SET_GAME_FIELD requires field and value',
            ERROR_CATEGORIES.VALIDATION
          );
        }
        newState.game[action.payload.field] = action.payload.value;
        break;

      case 'UPDATE_SCORE':
        newState.game.score = Math.max(
          0,
          newState.game.score + (action.payload?.delta || 0)
        );
        break;

      case 'START_GAME':
        newState.game = {
          ...newState.game,
          isActive: true,
          startTime: action.payload?.startTime || Date.now(),
          generatedColor: action.payload?.color || null,
          tipCount: action.payload?.tipCount || 3,
          computerTipCount: action.payload?.computerTipCount || 3,
        };
        break;

      case 'END_GAME':
        newState.game.isActive = false;
        newState.game.totalGamesPlayed += 1;

        if (action.payload?.won) {
          newState.game.correctGuesses += 1;
          newState.game.streak += 1;
          newState.game.bestStreak = Math.max(
            newState.game.bestStreak,
            newState.game.streak
          );
        } else {
          newState.game.streak = 0;
        }

        // Update user statistics
        newState.user.statistics.gamesPlayed += 1;
        if (action.payload?.won) {
          newState.user.statistics.gamesWon += 1;
        }
        break;

      case 'SET_UI_FIELD': {
        if (!action.payload || typeof action.payload.field !== 'string') {
          throw new ToneTrackerError(
            'SET_UI_FIELD requires field and value',
            ERROR_CATEGORIES.VALIDATION
          );
        }

        // Handle nested fields like 'feedback.message'
        const fieldParts = action.payload.field.split('.');
        let target = newState.ui;
        for (let i = 0; i < fieldParts.length - 1; i++) {
          target = target[fieldParts[i]];
        }
        target[fieldParts[fieldParts.length - 1]] = action.payload.value;
        break;
      }

      case 'SET_USER_PREFERENCE':
        if (!action.payload || typeof action.payload.key !== 'string') {
          throw new ToneTrackerError(
            'SET_USER_PREFERENCE requires key and value',
            ERROR_CATEGORIES.VALIDATION
          );
        }
        newState.user.preferences[action.payload.key] = action.payload.value;
        break;

      case 'ADD_ERROR':
        newState.system.errors.push({
          ...action.payload,
          timestamp: new Date().toISOString(),
        });
        // Keep only last 20 errors
        if (newState.system.errors.length > 20) {
          newState.system.errors = newState.system.errors.slice(-20);
        }
        break;

      default:
        // Allow custom action types through middleware
        break;
    }

    // Update system timestamp
    newState.system.lastUpdated = new Date().toISOString();

    return newState;
  }

  /**
   * Add state to history
   * @private
   */
  _addToHistory(state, action) {
    const historyEntry = {
      state: deepClone(state),
      action: deepClone(action),
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...state.history.states];

    // Remove any states after current index if we're not at the end
    if (state.history.currentIndex < newHistory.length - 1) {
      newHistory.splice(state.history.currentIndex + 1);
    }

    newHistory.push(historyEntry);

    // Limit history size
    if (newHistory.length > state.history.maxHistory) {
      newHistory.shift();
    }

    state.history.states = newHistory;
    state.history.currentIndex = newHistory.length - 1;
  }

  /**
   * Notify subscribers of state changes
   * @private
   */
  _notifySubscribers(previousState, newState, action) {
    for (const [path, subscribers] of this._subscribers) {
      if (path === '*') {
        // Global subscribers
        for (const callback of subscribers.values()) {
          try {
            callback(newState, previousState, action);
          } catch (error) {
            logError(
              new ToneTrackerError(
                `Subscriber callback error: ${error.message}`,
                ERROR_CATEGORIES.UI,
                ERROR_LEVELS.WARN,
                { path, error: error.message }
              ),
              { action },
              false
            );
          }
        }
      } else {
        // Path-specific subscribers
        const currentValue = this._getNestedValue(newState, path);
        const previousValue = this._getNestedValue(previousState, path);

        if (currentValue !== previousValue) {
          for (const callback of subscribers.values()) {
            try {
              callback(currentValue, previousValue, action);
            } catch (error) {
              logError(
                new ToneTrackerError(
                  `Subscriber callback error: ${error.message}`,
                  ERROR_CATEGORIES.UI,
                  ERROR_LEVELS.WARN,
                  { path, error: error.message }
                ),
                { action },
                false
              );
            }
          }
        }
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   * @private
   */
  _getNestedValue(obj, path) {
    return path
      .split('.')
      .reduce(
        (current, key) =>
          current && current[key] !== undefined ? current[key] : undefined,
        obj
      );
  }
}

// Export singleton instance
export const stateManager = new StateManager();

// Convenience action creators
export const actions = {
  startGame: (color, difficulty = 'easy') => ({
    type: 'START_GAME',
    payload: {
      color,
      startTime: Date.now(),
      tipCount: { easy: 3, medium: 2, hard: 1 }[difficulty],
      computerTipCount: { easy: 3, medium: 2, hard: 1 }[difficulty],
    },
  }),

  endGame: (won = false) => ({
    type: 'END_GAME',
    payload: { won },
  }),

  updateScore: (delta) => ({
    type: 'UPDATE_SCORE',
    payload: { delta },
  }),

  setGameField: (field, value) => ({
    type: 'SET_GAME_FIELD',
    payload: { field, value },
  }),

  setUIField: (field, value) => ({
    type: 'SET_UI_FIELD',
    payload: { field, value },
  }),

  setFeedback: (message, type = 'info', visible = true) => ({
    type: 'SET_UI_FIELD',
    payload: {
      field: 'feedback',
      value: { message, type, visible },
    },
  }),

  setUserPreference: (key, value) => ({
    type: 'SET_USER_PREFERENCE',
    payload: { key, value },
  }),

  addError: (error) => ({
    type: 'ADD_ERROR',
    payload: error,
  }),
};
