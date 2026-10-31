import { DIFFICULTIES } from './constants.js';

export const state = {
  generatedColor: null,
  startTime: null,
  score: 0,
  tipCount: 0,
  timerInterval: null,
  memorizeTimeout: null,
  computerTipCount: 0,
  isGameActive: false,
  difficulty: 'easy',
};

export function resetState() {
  state.generatedColor = null;
  state.startTime = null;
  // state.score = 0; // Score should persist between games, maybe? Let's keep it.
  state.tipCount = 0;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }
  state.timerInterval = null;
  // Cancel a pending "memorize" phase so a restarted game is not activated by a stale timer
  if (state.memorizeTimeout) {
    clearTimeout(state.memorizeTimeout);
  }
  state.memorizeTimeout = null;
  state.computerTipCount = 0;
  state.isGameActive = false;
}

export function setDifficulty(difficulty) {
  state.difficulty = difficulty;
  const settings = DIFFICULTIES[difficulty];
  state.tipCount = settings.tipCount;
  state.computerTipCount = settings.computerTipCount;
}
