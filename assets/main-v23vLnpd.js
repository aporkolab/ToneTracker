import '../css/main.css';
import { DOM } from './constants.js';
import { checkColor, computerGuess, startGame, adjustColor } from './game.js';
import {
  updateUserColor,
  updateComponentButtonsState,
  hideModal,
  updateStatistics,
} from './ui.js';
import { isValidHexColor } from './colorUtils.js';
import { setDifficulty } from './state.js';
import { i18n } from './i18n.js';
import { analytics, trackEvent, EVENT_TYPES } from './analytics.js';
import { storage } from './storage.js';
import { performanceMonitor, startTiming, endTiming, fpsMonitor } from './performance.js';
import { pwaManager } from './pwaManager.js';

// Event Listeners with Analytics Integration
function initializeEventListeners() {
  DOM.newGameButton.addEventListener('click', () => {
    startTiming('game-start');
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'new-game-button' });
    startGame();
    endTiming('game-start');
  });
  
  DOM.checkButton.addEventListener('click', () => {
    startTiming('color-check');
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'check-color-button' });
    checkColor();
    endTiming('color-check');
  });
  
  DOM.computerGuessButton.addEventListener('click', () => {
    trackEvent(EVENT_TYPES.COMPUTER_TIP_USED, { 
      feature: 'computer-tip-button',
      difficulty: storage.get('current_difficulty', 'medium')
    });
    computerGuess();
  });

  DOM.colorInput.addEventListener('input', () => {
    const userColor = '#' + DOM.colorInput.value.replace('#', '');
    if (isValidHexColor(userColor)) {
      updateUserColor(userColor);
      trackEvent(EVENT_TYPES.FEATURE_USED, { 
        feature: 'color-input-typing',
        inputLength: DOM.colorInput.value.length
      });
    }
  });

  DOM.colorAdjust.addEventListener('input', () => {
    const userColor = DOM.colorAdjust.value;
    if (isValidHexColor(userColor)) {
      DOM.colorInput.value = userColor.replace('#', '');
      updateUserColor(userColor);
      updateComponentButtonsState(userColor.replace('#', ''));
      trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'color-adjust-input' });
    }
  });

  // RGB Component buttons with tracking
  DOM.plusRedButton.addEventListener('click', () => {
    adjustColor('r', 1);
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'rgb-adjust', component: 'red', direction: 'plus' });
  });
  
  DOM.minusRedButton.addEventListener('click', () => {
    adjustColor('r', -1);
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'rgb-adjust', component: 'red', direction: 'minus' });
  });
  
  DOM.plusGreenButton.addEventListener('click', () => {
    adjustColor('g', 1);
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'rgb-adjust', component: 'green', direction: 'plus' });
  });
  
  DOM.minusGreenButton.addEventListener('click', () => {
    adjustColor('g', -1);
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'rgb-adjust', component: 'green', direction: 'minus' });
  });
  
  DOM.plusBlueButton.addEventListener('click', () => {
    adjustColor('b', 1);
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'rgb-adjust', component: 'blue', direction: 'plus' });
  });
  
  DOM.minusBlueButton.addEventListener('click', () => {
    adjustColor('b', -1);
    trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'rgb-adjust', component: 'blue', direction: 'minus' });
  });

  DOM.difficulty.addEventListener('change', (e) => {
    const newDifficulty = e.target.value;
    const oldDifficulty = storage.get('current_difficulty', 'medium');
    
    setDifficulty(newDifficulty);
    storage.set('current_difficulty', newDifficulty);
    
    trackEvent(EVENT_TYPES.DIFFICULTY_CHANGE, {
      oldDifficulty,
      newDifficulty,
      feature: 'difficulty-selector'
    });
    
    console.log(`🎯 Difficulty changed: ${oldDifficulty} → ${newDifficulty}`);
  });

  DOM.modalCloseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      hideModal();
      trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'modal-close-button' });
    });
  });

  DOM.resultModal.addEventListener('click', (e) => {
    if (e.target === DOM.resultModal) {
      hideModal();
      trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'modal-backdrop-close' });
    }
  });
}

// Initialize language system and load user preferences
async function initializeI18nAndPreferences() {
  try {
    startTiming('app-initialization');
    
    // Load user preferences from storage
    const userPreferences = storage.getUserPreferences();
    console.log('📋 Loading user preferences:', userPreferences);
    
    // Initialize i18n with preferred language
    await i18n.initialize(userPreferences.language);
    console.log('🌍 i18n initialized with language:', userPreferences.language);
    
    // Apply preferences to UI
    if (userPreferences.difficulty) {
      DOM.difficulty.value = userPreferences.difficulty;
      setDifficulty(userPreferences.difficulty);
    }
    
    // Create language switcher if container exists
    const langContainer = document.getElementById('language-switcher-container');
    if (langContainer) {
      const switcher = i18n.createLanguageSwitcher((newLang, oldLang) => {
        // Update user preferences when language changes
        const prefs = storage.getUserPreferences();
        prefs.language = newLang;
        storage.updateUserPreferences({ language: newLang });
        
        trackEvent(EVENT_TYPES.LANGUAGE_CHANGE, {
          oldLanguage: oldLang,
          newLanguage: newLang
        });
        
        // Refresh UI texts
        updateUIWithTranslations();
      });
      langContainer.appendChild(switcher);
    }
    
    // Update UI text with translations
    updateUIWithTranslations();
    
    endTiming('app-initialization');
    
  } catch (error) {
    console.error('❌ Failed to initialize i18n and preferences:', error);
    analytics.trackError(error, { context: 'app-initialization' });
  }
}

// Update UI elements with translated text
function updateUIWithTranslations() {
  try {
    // Update button texts
    DOM.newGameButton.textContent = i18n.t('ui.newGame');
    DOM.checkButton.textContent = i18n.t('ui.checkColor');
    DOM.computerGuessButton.textContent = i18n.t('ui.computerTip');
    
    // Update placeholder text
    DOM.colorInput.placeholder = i18n.t('ui.colorInputPlaceholder');
    
    // Update difficulty options
    const difficultyOptions = DOM.difficulty.querySelectorAll('option');
    if (difficultyOptions.length >= 3) {
      difficultyOptions[0].textContent = i18n.t('difficulty.easy');
      difficultyOptions[1].textContent = i18n.t('difficulty.medium');
      difficultyOptions[2].textContent = i18n.t('difficulty.hard');
    }
    
    // Update modal elements
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
      modalTitle.textContent = i18n.t('ui.gameResult');
    }
    
    console.log('🔤 UI updated with translations');
    
  } catch (error) {
    console.error('❌ Failed to update UI with translations:', error);
  }
}

// Initialize performance monitoring
function initializePerformanceMonitoring() {
  try {
    // Start FPS monitoring for game sessions
    fpsMonitor.start();
    console.log('📊 Performance monitoring started');
    
    // Track memory usage periodically
    setInterval(() => {
      performanceMonitor.takeMemorySnapshot?.();
    }, 30000); // Every 30 seconds
    
    // Log performance metrics every 5 minutes
    setInterval(() => {
      const report = performanceMonitor.generateReport();
      console.log('📈 Performance Report:', report);
      
      if (report.summary.criticalIssues > 0) {
        trackEvent(EVENT_TYPES.PERFORMANCE_ISSUE, {
          criticalIssues: report.summary.criticalIssues,
          warnings: report.summary.warnings
        });
      }
    }, 300000); // Every 5 minutes
    
  } catch (error) {
    console.error('❌ Failed to initialize performance monitoring:', error);
  }
}

// Initialize analytics with user consent
function initializeAnalytics() {
  try {
    // Check if user has given consent (GDPR compliance)
    const analyticsConsent = storage.get('analytics_consent', null);
    
    if (analyticsConsent === null) {
      // Show consent dialog (simplified version)
      const consentBanner = document.createElement('div');
      consentBanner.innerHTML = `
        <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #f8f9fa; padding: 16px; border-top: 1px solid #dee2e6; z-index: 1000;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: between; gap: 16px;">
            <div style="flex: 1;">
              <p style="margin: 0; font-size: 14px;">🍪 ${i18n.t('privacy.analyticsConsent') || 'We use analytics to improve your experience. No personal data is collected.'}</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="accept-analytics" class="btn btn-primary btn-sm">Accept</button>
              <button id="decline-analytics" class="btn btn-secondary btn-sm">Decline</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(consentBanner);
      
      document.getElementById('accept-analytics').onclick = () => {
        storage.set('analytics_consent', true);
        analytics.setEnabled(true);
        consentBanner.remove();
        console.log('✅ Analytics consent granted');
      };
      
      document.getElementById('decline-analytics').onclick = () => {
        storage.set('analytics_consent', false);
        analytics.setEnabled(false);
        consentBanner.remove();
        console.log('❌ Analytics consent declined');
      };
    } else {
      analytics.setEnabled(analyticsConsent);
      console.log('📊 Analytics:', analyticsConsent ? 'enabled' : 'disabled');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize analytics:', error);
  }
}

// Initialize app with all systems
async function initializeApp() {
  try {
    console.log('🚀 ToneTracker v2.0.0 initializing...');
    
    // Track app startup
    trackEvent(EVENT_TYPES.SESSION_START, {
      version: '2.0.0',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    // Initialize all systems
    await initializeI18nAndPreferences();
    initializeEventListeners();
    initializePerformanceMonitoring();
    initializeAnalytics();
    
    // Request persistent storage for PWA
    if (pwaManager) {
      await pwaManager.requestPersistentStorage();
    }
    
    console.log('✅ App initialization complete');
    
    // Load and display initial statistics
    updateStatistics();
    
    // Start the first game automatically
    startGame();
    
    // Track successful initialization
    trackEvent(EVENT_TYPES.FEATURE_USED, {
      feature: 'app-initialization-complete',
      loadTime: performance.now()
    });
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    analytics.trackError(error, { context: 'app-initialization' });
  }
}

// Handle app lifecycle events
function setupAppLifecycle() {
  // Handle page unload for analytics
  window.addEventListener('beforeunload', () => {
    trackEvent(EVENT_TYPES.SESSION_END, {
      sessionDuration: Date.now() - (window.sessionStartTime || Date.now()),
      timestamp: Date.now()
    });
    
    // Sync analytics data
    if (analytics) {
      analytics.flush(true); // Force flush
    }
  });
  
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'app-hidden' });
      fpsMonitor.stop();
    } else {
      trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'app-visible' });
      fpsMonitor.start();
    }
  });
  
  // Track when user is idle
  let idleTimer;
  const IDLE_TIME = 5 * 60 * 1000; // 5 minutes
  
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      trackEvent(EVENT_TYPES.FEATURE_USED, { feature: 'user-idle' });
    }, IDLE_TIME);
  }
  
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer, true);
  });
  
  resetIdleTimer();
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('💥 Global error:', event.error);
  analytics.trackError(event.error, {
    context: 'global-error-handler',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled promise rejection:', event.reason);
  analytics.trackError(new Error(event.reason), {
    context: 'unhandled-promise-rejection'
  });
});

// Make key objects globally available for debugging
window.toneTracker = {
  analytics,
  storage,
  i18n,
  performanceMonitor,
  pwaManager,
  version: '2.0.0'
};

// Record session start time
window.sessionStartTime = Date.now();

// Setup app lifecycle
setupAppLifecycle();

// Start the application
initializeApp();
