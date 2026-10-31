import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';

vi.mock('../../src/js/ui.js', () => ({
  updateFeedback: vi.fn(),
  playSound: vi.fn(),
  updateScore: vi.fn(),
  updateStatistics: vi.fn(),
  showAchievement: vi.fn(),
  showToast: vi.fn(),
  showResultModal: vi.fn(),
  disableGameControls: vi.fn(),
  enableGameControls: vi.fn(),
  updateTipButton: vi.fn(),
  updateUserColor: vi.fn(),
  updateRandomColor: vi.fn(),
  setPulseAnimation: vi.fn(),
  resetUI: vi.fn(),
  updateComponentButtonsState: vi.fn(),
  updateTimer: vi.fn(),
}));

vi.mock('../../src/js/analytics.js', () => ({
  analytics: { trackColorGuess: vi.fn() },
  trackGameStart: vi.fn(),
  trackGameEnd: vi.fn(),
  trackEvent: vi.fn(),
  EVENT_TYPES: { COLOR_GUESS: 'color_guess' },
}));

vi.mock('../../src/js/performance.js', () => ({
  startTiming: vi.fn(),
  endTiming: vi.fn(),
}));

let game;
let ui;
let state;
let storage;

beforeAll(async () => {
  // constants.js resolves DOM nodes at import time, so the markup must exist first
  document.body.innerHTML = `
    <input id="colorInput" />
    <input id="colorAdjust" />
    <select id="difficulty">
      <option value="easy">easy</option>
      <option value="medium">medium</option>
      <option value="hard">hard</option>
    </select>
  `;
  game = await import('../../src/js/game.js');
  ui = await import('../../src/js/ui.js');
  ({ state } = await import('../../src/js/state.js'));
  ({ storage } = await import('../../src/js/storage.js'));
});

const colorInput = () => document.getElementById('colorInput');
const difficulty = () => document.getElementById('difficulty');

function startActiveGame(level = 'easy', color = '#A1B2C3') {
  difficulty().value = level;
  game.startGame();
  state.generatedColor = color;
  vi.advanceTimersByTime(3000);
}

describe('game', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.clearAllMocks();
    localStorage.clear();
    storage.clear();
    state.score = 0;
  });

  afterEach(() => {
    game.startGame(); // ensure pending timers are owned by a fresh game
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('startGame', () => {
    it('shows the color for the memorize phase, then activates the game', () => {
      difficulty().value = 'medium';
      game.startGame();

      expect(state.isGameActive).toBe(false);
      expect(state.tipCount).toBe(2);
      expect(ui.disableGameControls).toHaveBeenCalled();

      vi.advanceTimersByTime(3000);

      expect(state.isGameActive).toBe(true);
      expect(state.startTime).not.toBeNull();
      expect(ui.enableGameControls).toHaveBeenCalledTimes(1);
    });

    it('cancels a pending memorize phase when restarted', () => {
      game.startGame();
      vi.advanceTimersByTime(2000);
      game.startGame();

      // The first game's timer would have fired here
      vi.advanceTimersByTime(1500);
      expect(state.isGameActive).toBe(false);
      expect(ui.enableGameControls).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1500);
      expect(state.isGameActive).toBe(true);
      expect(ui.enableGameControls).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkColor', () => {
    it('ignores guesses while no game is active', () => {
      colorInput().value = 'A1B2C3';
      game.checkColor();

      expect(ui.updateFeedback).not.toHaveBeenCalled();
    });

    it('wins on an exact match (case-insensitive) and records the game', () => {
      startActiveGame('easy');
      vi.advanceTimersByTime(4000);
      colorInput().value = 'a1b2c3';

      game.checkColor();

      const expectedScore = 100 - 4; // base score minus elapsed seconds
      expect(state.isGameActive).toBe(false);
      expect(state.score).toBe(expectedScore);
      expect(ui.showToast).toHaveBeenCalledWith(
        `🎉 Congratulations! Score: ${expectedScore}`,
        'success',
        4000
      );

      const stats = storage.getGameStatistics();
      expect(stats.gamesWon).toBe(1);
      expect(stats.bestScore).toBe(expectedScore);
    });

    it('decrements tips and gives feedback on a wrong guess', () => {
      startActiveGame('easy');
      colorInput().value = '000000';

      game.checkColor();

      expect(state.tipCount).toBe(2);
      expect(state.isGameActive).toBe(true);
      expect(ui.updateFeedback).toHaveBeenCalledWith(
        expect.stringContaining('Még 2 tippelési lehetőséged van')
      );
    });

    it('loses after the last tip and records numeric attempt counts', () => {
      const recordSpy = vi.spyOn(storage, 'recordGame');
      startActiveGame('hard');
      colorInput().value = '000000';

      game.checkColor();

      expect(state.isGameActive).toBe(false);
      expect(ui.showResultModal).toHaveBeenCalled();
      expect(recordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          won: false,
          attempts: 1,
          computerTipsUsed: 0,
        })
      );
    });
  });

  describe('achievements', () => {
    it('awards the milestone achievements on a fast, exact first win', () => {
      startActiveGame('easy');
      colorInput().value = 'A1B2C3';

      game.checkColor();

      const titles = ui.showAchievement.mock.calls.map(([title]) => title);
      expect(titles).toEqual(
        expect.arrayContaining([
          'First Victory',
          'New High Score!',
          'Perfect Match',
          'Lightning Fast',
        ])
      );
    });
  });

  describe('computerGuess', () => {
    it('fills in a guess and consumes a computer tip', () => {
      startActiveGame('medium');

      game.computerGuess();

      expect(state.computerTipCount).toBe(1);
      expect(colorInput().value).toMatch(/^[0-9A-F]{6}$/i);
      expect(ui.updateTipButton).toHaveBeenCalled();
    });

    it('does nothing when no computer tips are left', () => {
      startActiveGame('hard');
      game.computerGuess();
      vi.clearAllMocks();

      game.computerGuess();

      expect(state.computerTipCount).toBe(0);
      expect(ui.updateUserColor).not.toHaveBeenCalled();
    });
  });

  describe('adjustColor', () => {
    it('adjusts one RGB component of the current input', () => {
      startActiveGame();
      colorInput().value = '10FF00';

      game.adjustColor('r', 1);

      expect(colorInput().value).toBe('11ff00');
      expect(ui.updateComponentButtonsState).toHaveBeenCalledWith('11ff00');
    });

    it('falls back to black for invalid input', () => {
      startActiveGame();
      colorInput().value = 'nope';

      game.adjustColor('b', 1);

      expect(colorInput().value).toBe('000001');
      expect(ui.updateFeedback).toHaveBeenCalledWith(
        'Érvénytelen színkód, alapértelmezettre állítva.'
      );
    });
  });
});
