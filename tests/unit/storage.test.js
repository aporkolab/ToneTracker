import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager, STORAGE_KEYS } from '../../src/js/storage.js';

const game = (overrides = {}) => ({
  won: true,
  score: 100,
  time: 5000,
  difficulty: 'easy',
  accuracy: 90,
  targetColor: '#123456',
  ...overrides,
});

describe('StorageManager', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    storage = new StorageManager();
  });

  describe('get / set', () => {
    it('returns the default value for missing keys', () => {
      expect(storage.get('missing', 'fallback')).toBe('fallback');
    });

    it('round-trips JSON values through localStorage', () => {
      storage.set('key', { a: 1, list: [1, 2] });

      const fresh = new StorageManager();
      expect(fresh.get('key')).toEqual({ a: 1, list: [1, 2] });
    });

    it('returns the default value for corrupted JSON', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('broken', '{not json');

      expect(storage.get('broken', 'fallback')).toBe('fallback');
    });

    it('notifies subscribers on change', () => {
      const callback = vi.fn();
      storage.subscribe('watched', callback);

      storage.set('watched', 42);

      expect(callback).toHaveBeenCalledWith(42, 'watched');
    });
  });

  describe('recordGame', () => {
    it('updates totals, streaks and difficulty breakdown for wins and losses', () => {
      storage.recordGame(game({ score: 100, time: 4000 }));
      storage.recordGame(game({ score: 250, time: 2000, difficulty: 'hard' }));
      const stats = storage.recordGame(
        game({ won: false, score: 0, time: 6000 })
      );

      expect(stats.totalGames).toBe(3);
      expect(stats.gamesWon).toBe(2);
      expect(stats.gamesLost).toBe(1);
      expect(stats.totalScore).toBe(350);
      expect(stats.bestScore).toBe(250);
      expect(stats.bestTime).toBe(2000);
      expect(stats.averageScore).toBe(175);
      expect(stats.currentStreak).toBe(0);
      expect(stats.bestStreak).toBe(2);
      expect(stats.difficultyCounts.easy).toEqual({
        played: 2,
        won: 1,
        totalScore: 100,
      });
      expect(stats.difficultyCounts.hard).toEqual({
        played: 1,
        won: 1,
        totalScore: 250,
      });
      expect(stats.colorAccuracyHistory).toEqual([90, 90, 90]);
    });

    it('keeps only the last 50 accuracy values', () => {
      for (let i = 0; i < 55; i++) {
        storage.recordGame(game({ won: false, accuracy: i }));
      }

      const history = storage.getGameStatistics().colorAccuracyHistory;
      expect(history).toHaveLength(50);
      expect(history[0]).toBe(5);
      expect(history[49]).toBe(54);
    });

    it('adds a high score only for won games with a positive score', () => {
      storage.recordGame(game({ won: false, score: 0 }));
      storage.recordGame(game({ won: true, score: 0 }));
      expect(storage.getHighScores().scores).toHaveLength(0);

      storage.recordGame(game({ score: 120 }));
      expect(storage.getHighScores().scores.map((s) => s.score)).toEqual([120]);
    });

    it('does not leak recorded data into the defaults after clear()', () => {
      storage.recordGame(game({ score: 300, difficulty: 'medium' }));

      storage.clear();

      const stats = storage.getGameStatistics();
      expect(stats.totalGames).toBe(0);
      expect(stats.colorAccuracyHistory).toEqual([]);
      expect(stats.difficultyCounts.medium).toEqual({
        played: 0,
        won: 0,
        totalScore: 0,
      });
      expect(storage.getHighScores().scores).toEqual([]);
    });
  });

  describe('addHighScore', () => {
    it('sorts by score descending, then by time ascending', () => {
      storage.addHighScore({ score: 100, time: 3000 });
      storage.addHighScore({ score: 200, time: 9000 });
      storage.addHighScore({ score: 100, time: 1000 });

      const scores = storage.getHighScores().scores;
      expect(scores.map((s) => [s.score, s.time])).toEqual([
        [200, 9000],
        [100, 1000],
        [100, 3000],
      ]);
    });

    it('trims the list to maxScores', () => {
      const highScores = storage.getHighScores();
      highScores.maxScores = 2;
      storage.set(STORAGE_KEYS.HIGH_SCORES, highScores);

      [10, 30, 20].forEach((score) => storage.addHighScore({ score, time: 1 }));

      expect(storage.getHighScores().scores.map((s) => s.score)).toEqual([
        30, 20,
      ]);
    });

    it('filters top scores by difficulty', () => {
      storage.addHighScore({ score: 10, time: 1, difficulty: 'easy' });
      storage.addHighScore({ score: 20, time: 1, difficulty: 'hard' });

      expect(storage.getTopScores('hard').map((s) => s.score)).toEqual([20]);
      expect(storage.getTopScores(null, 1).map((s) => s.score)).toEqual([20]);
    });
  });

  describe('user preferences', () => {
    it('merges updates into the stored preferences', () => {
      expect(storage.getUserPreferences().difficulty).toBe('easy');

      storage.updateUserPreferences({ difficulty: 'hard' });

      const prefs = new StorageManager().getUserPreferences();
      expect(prefs.difficulty).toBe('hard');
      expect(prefs.soundEnabled).toBe(true);
    });
  });

  describe('importData', () => {
    it('rejects non-object input', () => {
      expect(() => storage.importData(null)).toThrow('Invalid data format');
    });

    it('replaces or merges known keys', () => {
      storage.set(STORAGE_KEYS.SETTINGS, { a: 1, b: 1 });

      storage.importData({ SETTINGS: { b: 2 } }, true);
      expect(storage.get(STORAGE_KEYS.SETTINGS)).toEqual({ a: 1, b: 2 });

      storage.importData({ SETTINGS: { c: 3 } });
      expect(storage.get(STORAGE_KEYS.SETTINGS)).toEqual({ c: 3 });
    });
  });

  describe('migration', () => {
    it('upgrades unversioned stored data to the current schema with defaults filled in', () => {
      localStorage.setItem(
        STORAGE_KEYS.GAME_STATISTICS,
        JSON.stringify({ totalGames: 7 })
      );
      localStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify({ difficulty: 'hard' })
      );
      localStorage.setItem(
        STORAGE_KEYS.HIGH_SCORES,
        JSON.stringify({ scores: [{ score: 5 }] })
      );

      const migrated = new StorageManager();

      const stats = migrated.getGameStatistics();
      expect(stats.version).toBe(1);
      expect(stats.totalGames).toBe(7);
      expect(stats.gamesWon).toBe(0);
      expect(migrated.getUserPreferences()).toMatchObject({
        version: 1,
        difficulty: 'hard',
        soundEnabled: true,
      });
      expect(migrated.getHighScores()).toMatchObject({
        version: 1,
        maxScores: 100,
        scores: [{ score: 5 }],
      });
    });
  });

  describe('remove / export / info', () => {
    it('removes a key and notifies subscribers with null', () => {
      const callback = vi.fn();
      storage.set('temp', 1);
      storage.subscribe('temp', callback);

      storage.remove('temp');

      expect(storage.get('temp', 'gone')).toBe('gone');
      expect(callback).toHaveBeenCalledWith(null, 'temp');
    });

    it('stops notifying after unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = storage.subscribe('k', callback);

      unsubscribe();
      storage.set('k', 1);

      expect(callback).not.toHaveBeenCalled();
    });

    it('exports every known key with metadata', () => {
      storage.updateUserPreferences({ difficulty: 'medium' });

      const data = storage.exportData();

      expect(Object.keys(data)).toEqual(
        expect.arrayContaining([
          ...Object.keys(STORAGE_KEYS),
          'exportedAt',
          'version',
        ])
      );
      expect(data.USER_PREFERENCES.difficulty).toBe('medium');
    });

    it('reports storage usage', () => {
      storage.set(STORAGE_KEYS.SETTINGS, { a: 'x'.repeat(2048) });

      const info = storage.getStorageInfo();

      expect(info.supported).toBe(true);
      expect(info.keys[STORAGE_KEYS.SETTINGS].exists).toBe(true);
      expect(info.keys[STORAGE_KEYS.LOCALE]).toMatchObject({
        exists: false,
        size: 0,
        sizeFormatted: '0 Bytes',
      });
      expect(info.totalSizeFormatted).toMatch(/KB$/);
      expect(storage.formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('without localStorage support', () => {
    it('falls back to defaults and does not persist', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubGlobal('localStorage', {
        setItem: () => {
          throw new Error('SecurityError');
        },
      });

      const unsupported = new StorageManager();

      expect(unsupported.isSupported).toBe(false);
      expect(unsupported.set('k', 1)).toBe(false);
      expect(unsupported.get('k', 'default')).toBe('default');
      expect(unsupported.getStorageInfo()).toEqual({ supported: false });
      vi.unstubAllGlobals();
    });
  });
});
