import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';

let ui;
let storage;

beforeAll(async () => {
  // constants.js resolves DOM nodes at import time, so the markup must exist first
  document.body.innerHTML = `
    <div id="feedback"></div>
    <div id="randomColor"></div>
    <div id="userColor"></div>
    <input id="colorInput" />
    <button id="check-button"></button>
    <button class="btn-secondary" id="secondary"></button>
    <div id="timer"></div>
    <div id="score"></div>
    <div id="correctColorCode"></div>
    <button id="plusRedButton"></button><button id="minusRedButton"></button>
    <button id="plusGreenButton"></button><button id="minusGreenButton"></button>
    <button id="plusBlueButton"></button><button id="minusBlueButton"></button>
    <button id="computer-tip-button"></button>
    <div id="total-games"></div>
    <div id="win-rate"></div>
    <div id="best-score"></div>
    <div id="avg-accuracy"></div>
  `;
  ui = await import('../../src/js/ui.js');
  ({ storage } = await import('../../src/js/storage.js'));
});

const text = (id) => document.getElementById(id).textContent;

describe('ui', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.clear();
    storage.clear();
  });

  afterEach(() => {
    document
      .querySelectorAll('.toast, .achievement-notification')
      .forEach((el) => el.remove());
    vi.restoreAllMocks();
  });

  describe('updateStatistics', () => {
    it('shows zeros when no games were played', () => {
      ui.updateStatistics();

      expect(text('total-games')).toBe('0');
      expect(text('win-rate')).toBe('0%');
      expect(text('best-score')).toBe('0');
      expect(text('avg-accuracy')).toBe('0%');
    });

    it('reflects recorded games', () => {
      storage.recordGame({
        won: true,
        score: 150,
        time: 1000,
        difficulty: 'easy',
        accuracy: 100,
      });
      storage.recordGame({
        won: false,
        score: 0,
        time: 1000,
        difficulty: 'easy',
        accuracy: 50,
      });
      storage.recordGame({
        won: true,
        score: 90,
        time: 1000,
        difficulty: 'easy',
        accuracy: 90,
      });

      ui.updateStatistics();

      expect(text('total-games')).toBe('3');
      expect(text('win-rate')).toBe('67%');
      expect(text('best-score')).toBe('150');
      expect(text('avg-accuracy')).toBe('80%');
    });
  });

  describe('updateComponentButtonsState', () => {
    it('disables buttons that would leave the 0-255 range', () => {
      ui.updateComponentButtonsState('FF0080');

      expect(document.getElementById('plusRedButton').disabled).toBe(true);
      expect(document.getElementById('minusRedButton').disabled).toBe(false);
      expect(document.getElementById('minusGreenButton').disabled).toBe(true);
      expect(document.getElementById('plusBlueButton').disabled).toBe(false);
      expect(document.getElementById('minusBlueButton').disabled).toBe(false);
    });
  });

  describe('showToast', () => {
    it('renders the message as text, not HTML', () => {
      ui.showToast('<img src=x onerror=alert(1)>', 'error');

      const toast = document.querySelector('.toast.toast-error');
      expect(toast.querySelector('img')).toBeNull();
      expect(toast.querySelector('.toast-message').textContent).toBe(
        '<img src=x onerror=alert(1)>'
      );
    });

    it('removes itself after the given duration', () => {
      vi.useFakeTimers();
      ui.showToast('bye', 'info', 1000);

      vi.advanceTimersByTime(1300);

      expect(document.querySelector('.toast')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('showAchievement', () => {
    it('renders the title and description as text', () => {
      ui.showAchievement('<b>Bold</b>', 'desc');

      const el = document.querySelector('.achievement-notification');
      expect(el.querySelector('b')).toBeNull();
      expect(el.querySelector('.achievement-name').textContent).toBe(
        '<b>Bold</b>'
      );
      expect(el.querySelector('.achievement-desc').textContent).toBe('desc');
    });
  });

  describe('playSound', () => {
    it('plays bundled sounds and ignores unknown ones', () => {
      const play = vi.fn(() => Promise.resolve());
      const AudioSpy = vi.fn(function () {
        this.play = play;
      });
      vi.stubGlobal('Audio', AudioSpy);

      ui.playSound('correct');
      ui.playSound('start');

      expect(AudioSpy).toHaveBeenCalledTimes(1);
      expect(AudioSpy.mock.calls[0][0]).toMatch(/correct\.mp3$/);
      expect(play).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it('handles a rejected play() promise', async () => {
      const error = new Error('NotAllowedError');
      vi.stubGlobal(
        'Audio',
        vi.fn(function () {
          this.play = () => Promise.reject(error);
        })
      );
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      ui.playSound('wrong');
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleError).toHaveBeenCalledWith('Hangfájl hiba: ', error);
      vi.unstubAllGlobals();
    });
  });

  describe('basic rendering helpers', () => {
    it('formats the elapsed time in Hungarian', async () => {
      const { state } = await import('../../src/js/state.js');
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

      state.startTime = Date.now() - 5000;
      ui.updateTimer();
      expect(text('timer')).toBe('5 másodperc');

      state.startTime = Date.now() - (3600 + 61) * 1000;
      ui.updateTimer();
      expect(text('timer')).toBe('1 óra 1 perc 1 másodperc');
      vi.useRealTimers();
    });

    it('updates colors, feedback, score and the result modal', async () => {
      const { state } = await import('../../src/js/state.js');
      state.score = 42;
      state.generatedColor = '#ABCDEF';

      ui.updateUserColor('#ff0000');
      ui.updateRandomColor('#00ff00', 'memo');
      ui.updateFeedback('hello');
      ui.updateScore();
      ui.showResultModal();

      expect(document.getElementById('userColor').style.backgroundColor).toBe(
        '#ff0000'
      );
      expect(text('randomColor')).toBe('memo');
      expect(text('feedback')).toBe('hello');
      expect(
        document
          .getElementById('feedback')
          .classList.contains('feedback-animate')
      ).toBe(true);
      expect(text('score')).toBe('42');
      expect(text('correctColorCode')).toBe('#ABCDEF');
      expect(document.body.classList.contains('modal-open')).toBe(true);

      ui.hideModal();
      expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    it('reflects remaining computer tips on the tip button', async () => {
      const { state } = await import('../../src/js/state.js');
      const button = document.getElementById('computer-tip-button');

      state.computerTipCount = 2;
      ui.updateTipButton();
      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Gép tippje (2 maradt)');

      state.computerTipCount = 0;
      ui.updateTipButton();
      expect(button.disabled).toBe(true);
      expect(button.textContent).toBe('Nincs több tipp');
    });

    it('enables and disables the game controls', () => {
      ui.disableGameControls();
      expect(document.getElementById('check-button').disabled).toBe(true);
      expect(document.getElementById('secondary').disabled).toBe(true);

      ui.enableGameControls();
      expect(document.getElementById('check-button').disabled).toBe(false);
      expect(document.getElementById('secondary').disabled).toBe(false);
    });

    it('toggles the pulse animation and resets the board', () => {
      ui.setPulseAnimation(true);
      expect(
        document.getElementById('randomColor').classList.contains('pulsing')
      ).toBe(true);
      ui.setPulseAnimation(false);
      expect(
        document.getElementById('randomColor').classList.contains('pulsing')
      ).toBe(false);

      document.getElementById('colorInput').value = 'ABCDEF';
      ui.resetUI();
      expect(document.getElementById('colorInput').value).toBe('');
      expect(text('feedback')).toBe('');
      expect(text('timer')).toBe('0');
    });
  });
});
