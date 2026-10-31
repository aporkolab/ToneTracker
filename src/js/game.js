import { state, resetState, setDifficulty } from './state.js';
import * as ui from './ui.js';
import * as colorUtils from './colorUtils.js';
import { DOM, STRINGS, DIFFICULTIES } from './constants.js';
import { analytics, trackGameStart, trackGameEnd, trackEvent, EVENT_TYPES } from './analytics.js';
import { storage } from './storage.js';
import { startTiming, endTiming } from './performance.js';

function startTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }
  state.timerInterval = setInterval(ui.updateTimer, 1000);
}

function calculateScore() {
  const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
  const baseScore = DIFFICULTIES[state.difficulty].score;
  const newScore = Math.max(0, baseScore - elapsedTime);
  state.score += newScore;
}

function calculateAccuracy() {
  if (!state.generatedColor || !DOM.colorInput.value) return 0;
  
  const userColor = '#' + DOM.colorInput.value.replace('#', '');
  const targetColor = state.generatedColor;
  
  // Calculate color difference using Delta E approximation
  const deltaE = colorUtils.calculateColorDifference(userColor, targetColor);
  
  // Convert Delta E to accuracy percentage (0-100)
  // Perfect match (deltaE = 0) = 100%, deltaE > 100 = 0%
  const accuracy = Math.max(0, Math.min(100, 100 - (deltaE / 100) * 100));
  
  return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
}

/**
 * Check for and show achievement notifications
 * @param {boolean} won - Whether the game was won
 * @param {number} score - Final score
 * @param {Object} stats - Current game statistics
 */
function checkAndShowAchievements(won, score) {
  if (!won) return;
  
  try {
    const gameStats = storage.getGameStatistics();
    const highScores = storage.getHighScores().scores;
    
    // First win achievement
    if (gameStats.gamesWon === 1) {
      ui.showAchievement(
        'First Victory',
        'Congratulations on your first successful color match!'
      );
    }
    
    // Multiple wins milestones
    const winMilestones = [5, 10, 25, 50, 100];
    if (winMilestones.includes(gameStats.gamesWon)) {
      ui.showAchievement(
        `${gameStats.gamesWon} Wins`,
        `You've successfully completed ${gameStats.gamesWon} games!`
      );
    }
    
    // High score achievement
    if (highScores.length > 0 && score === highScores[0].score) {
      ui.showAchievement(
        'New High Score!',
        `Amazing! You scored ${score} points!`
      );
    }
    
    // Perfect accuracy achievement
    const accuracy = calculateAccuracy();
    if (accuracy === 100) {
      ui.showAchievement(
        'Perfect Match',
        'Incredible! You got the exact color!'
      );
    }
    
    // Speed achievement (won in less than 10 seconds)
    const gameDuration = Date.now() - state.startTime;
    if (gameDuration < 10000) {
      ui.showAchievement(
        'Lightning Fast',
        'You completed the game in under 10 seconds!'
      );
    }
    
    // Difficulty-based achievements
    if (state.difficulty === 'hard') {
      ui.showAchievement(
        'Hard Mode Master',
        'Excellent work completing hard difficulty!'
      );
    }
    
  } catch (error) {
    console.error('❌ Failed to check achievements:', error);
  }
}

function endGame(isCorrect) {
  clearInterval(state.timerInterval);
  state.isGameActive = false;
  
  // Calculate game metrics
  const gameDuration = Date.now() - state.startTime;
  const difficulty = state.difficulty;
  const accuracy = calculateAccuracy();
  const settings = DIFFICULTIES[difficulty];
  const computerTipsUsed = settings.computerTipCount - state.computerTipCount;
  
  if (isCorrect) {
    ui.updateFeedback(STRINGS.congratulations);
    ui.playSound('correct');
    calculateScore();
    ui.updateScore();
    
    // Track successful game completion
    trackGameEnd(true, state.score, gameDuration, difficulty, accuracy);
    
    // Record game statistics
    storage.recordGame({
      won: true,
      score: state.score,
      time: gameDuration,
      difficulty: difficulty,
      accuracy: accuracy,
      targetColor: state.generatedColor,
      attempts: settings.tipCount - state.tipCount + 1,
      computerTipsUsed,
      timestamp: Date.now()
    });
    
    console.log('🎉 Game won!', {
      score: state.score,
      time: `${Math.round(gameDuration / 1000)}s`,
      accuracy: `${accuracy}%`,
      difficulty
    });
    
  } else {
    ui.updateFeedback(STRINGS.sorry);
    ui.playSound('wrong');
    
    // Track failed game completion
    trackGameEnd(false, 0, gameDuration, difficulty, accuracy);
    
    // Record failed game
    storage.recordGame({
      won: false,
      score: 0,
      time: gameDuration,
      difficulty: difficulty,
      accuracy: accuracy,
      targetColor: state.generatedColor,
      attempts: settings.tipCount,
      computerTipsUsed,
      timestamp: Date.now()
    });
    
    console.log('💔 Game lost', {
      time: `${Math.round(gameDuration / 1000)}s`,
      accuracy: `${accuracy}%`,
      difficulty,
      targetColor: state.generatedColor
    });
  }
  
  const finalScore = isCorrect ? state.score : 0;

  // End performance timing
  endTiming('game-session', {
    won: isCorrect,
    difficulty: difficulty,
    score: finalScore
  });
  
  // Update statistics display
  ui.updateStatistics();
  
  // Show achievement notifications for milestones
  checkAndShowAchievements(isCorrect, finalScore);
  
  // Show result notification
  if (isCorrect) {
    ui.showToast(
      `🎉 Congratulations! Score: ${finalScore}`,
      'success',
      4000
    );
  } else {
    ui.showToast(
      `😔 Better luck next time! Target was ${state.generatedColor}`,
      'warning',
      4000
    );
  }

  ui.showResultModal();
  ui.disableGameControls();
}

export function checkColor() {
  if (!state.isGameActive) return;

  const userColor = '#' + DOM.colorInput.value.replace('#', '');
  const isCorrect = userColor.toUpperCase() === state.generatedColor;
  const accuracy = calculateAccuracy();
  
  // Track color guess attempt
  analytics.trackColorGuess(userColor, state.generatedColor, accuracy, isCorrect);
  
  if (isCorrect) {
    endGame(true);
  } else {
    state.tipCount--;
    
    trackEvent(EVENT_TYPES.COLOR_GUESS, {
      attempt: DIFFICULTIES[state.difficulty].tipCount - state.tipCount,
      totalAttempts: DIFFICULTIES[state.difficulty].tipCount,
      accuracy: accuracy,
      remainingTips: state.tipCount,
      difficulty: state.difficulty
    });
    
    if (state.tipCount > 0) {
      let feedbackMessage = STRINGS.tryAgain(state.tipCount);
      feedbackMessage += colorUtils.compareColors(
        userColor,
        state.generatedColor
      );
      ui.updateFeedback(feedbackMessage);
      
      console.log(`🎯 Color guess: ${accuracy}% accuracy, ${state.tipCount} tips remaining`);
    } else {
      endGame(false);
    }
  }
}

export function computerGuess() {
  if (state.computerTipCount <= 0 || !state.isGameActive) return;

  const messages = [
    { text: 'Ez közel lehet!', type: 'close' },
    { text: 'Ez csak egy tipp, ne bízz meg benne!', type: 'wrong' },
    { text: 'Ez csak vicc volt!', type: 'silly' },
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  let guess;
  switch (randomMessage.type) {
    case 'close':
      guess = colorUtils.generateCloseColor(state.generatedColor);
      break;
    case 'wrong':
      guess = colorUtils.generateRandomColor();
      break;
    case 'silly':
      guess = '#FFFFFF';
      break;
  }

  DOM.colorInput.value = guess.replace('#', '');
  ui.updateUserColor(guess);
  ui.updateFeedback(randomMessage.text);
  state.computerTipCount--;
  ui.updateTipButton();
}

export function adjustColor(component, value) {
  if (!state.isGameActive) return;
  let currentColor = DOM.colorInput.value.replace('#', '');
  if (!colorUtils.isValidHexColor(currentColor)) {
    currentColor = '000000';
    ui.updateFeedback(STRINGS.invalidColor);
  }
  const adjustedColor = colorUtils.adjustHexColor(
    currentColor,
    component,
    value
  );
  DOM.colorInput.value = adjustedColor;
  DOM.colorAdjust.value = '#' + adjustedColor;
  ui.updateUserColor('#' + adjustedColor);

  const feedbackMessage = colorUtils.compareColors(
    adjustedColor,
    state.generatedColor
  );
  ui.updateFeedback(feedbackMessage);
  ui.updateComponentButtonsState(adjustedColor);
}

export function startGame() {
  resetState();
  setDifficulty(DOM.difficulty.value);
  ui.resetUI();

  state.generatedColor = colorUtils.generateRandomColor();
  ui.updateRandomColor(state.generatedColor, STRINGS.memorizeColor);
  ui.setPulseAnimation(true);
  ui.disableGameControls();

  // Track game start
  trackGameStart(state.difficulty, state.generatedColor);
  startTiming('game-session');

  state.memorizeTimeout = setTimeout(() => {
    state.memorizeTimeout = null;
    ui.updateRandomColor('#FFFFFF', '');
    ui.setPulseAnimation(false);
    state.isGameActive = true;
    ui.playSound('start');
    ui.enableGameControls();
    ui.updateTipButton();
    state.startTime = Date.now();
    startTimer();
  }, 3000);
}
