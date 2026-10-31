import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ToneTrackerError,
  ErrorHandler,
  errorHandler,
  wrapSync,
  wrapAsync,
  logError,
  ERROR_CATEGORIES,
  ERROR_LEVELS,
} from '../../src/js/errorHandler.js';

describe('ToneTrackerError', () => {
  it('carries category, level, context and a stack trace', () => {
    const error = new ToneTrackerError(
      'boom',
      ERROR_CATEGORIES.UI,
      ERROR_LEVELS.WARN,
      { id: 1 }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ToneTrackerError');
    expect(error.category).toBe('ui');
    expect(error.level).toBe('warn');
    expect(error.context).toEqual({ id: 1 });
    expect(typeof error.stack).toBe('string');
    expect(error.stack).toContain('boom');
  });

  it('defaults to a game logic error', () => {
    const error = new ToneTrackerError('x');

    expect(error.category).toBe(ERROR_CATEGORIES.GAME_LOGIC);
    expect(error.level).toBe(ERROR_LEVELS.ERROR);
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    errorHandler.logger.clearLogs();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    document.getElementById('error-notification')?.remove();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is a singleton', () => {
    expect(new ErrorHandler()).toBe(errorHandler);
  });

  it('logs errors and shows a localized message that hides after 5s', () => {
    errorHandler.handleError(
      new ToneTrackerError('disk full', ERROR_CATEGORIES.STORAGE)
    );

    const notification = document.getElementById('error-notification');
    expect(notification.textContent).toBe(
      'Adattárolási hiba. Ellenőrizze a böngésző beállításait.'
    );
    expect(notification.style.display).toBe('block');

    vi.advanceTimersByTime(5000);
    expect(notification.style.display).toBe('none');
    expect(errorHandler.logger.getRecentLogs(1)[0].message).toBe('disk full');
  });

  it('uses a generic message for unknown categories', () => {
    const error = new Error('plain');

    expect(errorHandler.getUserFriendlyMessage(error)).toBe(
      'Váratlan hiba történt. Kérjük, próbálja újra.'
    );
  });

  it('persists only error/fatal levels and keeps the last 20', () => {
    errorHandler.handleError(
      new ToneTrackerError('warn', undefined, ERROR_LEVELS.WARN),
      {},
      false
    );
    for (let i = 0; i < 25; i++) {
      errorHandler.handleError(new ToneTrackerError(`e${i}`), {}, false);
    }

    const stored = JSON.parse(localStorage.getItem('tonetracker_errors'));
    expect(stored).toHaveLength(20);
    expect(stored[0].message).toBe('e5');
    expect(stored.some((entry) => entry.message === 'warn')).toBe(false);
  });

  it('caps in-memory logs at maxLogs', () => {
    for (let i = 0; i < 105; i++) {
      errorHandler.handleError(
        new ToneTrackerError(`e${i}`, undefined, ERROR_LEVELS.INFO),
        {},
        false
      );
    }

    expect(errorHandler.logger.logs).toHaveLength(100);
    expect(errorHandler.logger.logs[0].message).toBe('e5');
  });

  it('aggregates error statistics by level and category', () => {
    logError(
      new ToneTrackerError('a', ERROR_CATEGORIES.UI, ERROR_LEVELS.WARN),
      {},
      false
    );
    logError(
      new ToneTrackerError('b', ERROR_CATEGORIES.UI, ERROR_LEVELS.ERROR),
      {},
      false
    );

    const stats = errorHandler.getErrorStats();
    expect(stats.total).toBe(2);
    expect(stats.byLevel).toEqual({ warn: 1, error: 1 });
    expect(stats.byCategory).toEqual({ ui: 2 });
  });

  it('wrapSync passes results through and logs and rethrows failures', () => {
    expect(wrapSync((a, b) => a + b)(1, 2)).toBe(3);

    const failing = wrapSync(() => {
      throw new Error('nope');
    }, 'parsing');

    expect(() => failing()).toThrow('nope');
    const [entry] = errorHandler.logger.getRecentLogs(1);
    expect(entry.message).toBe('Error in parsing: nope');
    expect(entry.context).toMatchObject({
      originalError: 'nope',
      context: 'parsing',
    });
  });

  it('wrapAsync keeps ToneTrackerErrors as-is', async () => {
    const original = new ToneTrackerError('typed', ERROR_CATEGORIES.NETWORK);
    const failing = wrapAsync(async () => {
      throw original;
    });

    await expect(failing()).rejects.toBe(original);
    expect(errorHandler.logger.getRecentLogs(1)[0].category).toBe('network');
    await expect(wrapAsync(async () => 'ok')()).resolves.toBe('ok');
  });

  it('handles uncaught errors and unhandled rejections from window events', () => {
    const spy = vi
      .spyOn(errorHandler, 'handleError')
      .mockImplementation(() => {});

    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'kaboom',
        filename: 'a.js',
        lineno: 3,
      })
    );
    const rejection = new Event('unhandledrejection');
    rejection.reason = 'nope';
    window.dispatchEvent(rejection);

    expect(spy.mock.calls.map(([error]) => error.message)).toEqual([
      'Uncaught Exception: kaboom',
      'Unhandled Promise Rejection: nope',
    ]);
  });
});
