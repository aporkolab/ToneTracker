/**
 * @fileoverview Internationalization (i18n) system
 * Provides multi-language support with locale switching and formatting
 */

import {
  ToneTrackerError,
  ERROR_CATEGORIES,
  ERROR_LEVELS,
} from './errorHandler.js';

/**
 * Translation resources for different languages
 */
const translations = {
  hu: {
    // Game UI
    gameTitle: 'Tonetracker v.2.0.0',
    gameDescription:
      'Színfelismerő játék: memorizálj egy színt, majd próbáld meg reprodukálni hex kódok vagy RGB értékek segítségével.',

    // Controls
    checkButton: 'Ellenőriz',
    computerTipButton: 'Gép tippje',
    newGameButton: 'Új játék',
    closeButton: 'Bezár',

    // Input labels
    hexColorInput: 'Hex színkód bevitele',
    hexColorPlaceholder: 'Írd be a hex színkódot (pl. ff5733)',
    hexColorHelp: 'Hat karakteres hex kód, például ff5733.',
    colorAdjustLabel: 'Szín módosítása:',
    colorAdjustHelp: 'Hex színkód közvetlen szerkesztése.',
    difficultyLabel: 'Nehézségi szint:',
    difficultyHelp:
      'A nehézségi szint meghatározza a rendelkezésre álló tippek számát.',

    // Difficulty levels
    difficultyEasy: 'Könnyű (3 tipp)',
    difficultyMedium: 'Közepes (2 tipp)',
    difficultyHard: 'Nehéz (1 tipp)',

    // Color components
    colorComponents: 'Szín komponensek:',
    redChannel: 'Vörös',
    greenChannel: 'Zöld',
    blueChannel: 'Kék',
    increaseValue: '{{channel}} érték növelése 1-gyel',
    decreaseValue: '{{channel}} érték csökkentése 1-gyel',

    // ARIA labels
    skipToMain: 'Ugrás a fő tartalomra',
    gameArea: 'Játék terület',
    colorComparison: 'Szín összehasonlító terület',
    targetColor: 'Megjegyzendő szín',
    userColor: 'Az általad beállított szín',
    targetColorHelp:
      'Ez a szín jelenik meg 3 másodpercig. Memorizáld és próbáld reprodukálni.',
    gameControls: 'Játék vezérlő gombok',
    gameStats: 'Játék statisztikák',
    rgbControls: 'RGB értékek finomhangolása',
    creatorInfo: 'Alkotó információk',

    // Button help texts
    checkButtonHelp: 'Ellenőrzi a beírt színkódot és visszajelzést ad.',
    computerTipHelp: 'Gép által generált tipp a helyes színhez.',
    newGameHelp:
      'Új játék indítása - egy véletlen szín jelenik meg 3 másodpercig.',

    // Feedback messages
    memorizeColor: 'Memorizáld a színt!',
    congratulations: 'Gratulálok! Eltaláltad!',
    sorry: 'Sajnálom, nem találtad el.',
    tryAgain: 'Próbáld újra! Még {{count}} tippelési lehetőséged van. ',
    noMoreTips: 'Nincs több tipp',
    computerTip: 'Gép tippje ({{count}} maradt)',
    invalidColor: 'Érvénytelen színkód, alapértelmezettre állítva.',

    // Color comparison feedback
    colorAccuracy: 'A tipp {{percentage}}%-ban helyes.',
    veryClose: 'Nagyon közel vagy!',
    goodProgress: 'Jó úton haladsz!',
    needsWork: 'Nem rossz, de még dolgoznod kell rajta.',
    farOff: 'Eléggé eltértél a helyes színtől.',

    // Game stats
    time: 'Idő',
    elapsedTime: 'Eltelt idő',
    score: 'Pontok',
    currentScore: 'Jelenlegi pontok',
    seconds: 'másodperc',

    // Modal
    gameResult: 'Játék eredménye',
    correctColorCode: 'A helyes színkód:',
    closeModal: 'Ablak bezárása',

    // Time formatting
    timeFormat: {
      hours: 'óra',
      minutes: 'perc',
      seconds: 'másodperc',
    },

    // Creator info
    creatorName: 'Dr. Porkoláb Ádám',
    creatorTitle: 'A digitális színek mestere',
    creatorBio:
      "Amikor épp nem színkódokat tör be, akkor új módszereket talál ki a virtuális szivárványok hajszolására. Következetesen a 'Hex-kódtörő' címért versenyez, és a billentyűzetével töri fel a színes világok titkait.",
    contact: 'Elérhetőség:',
    website: 'Profiloldal:',
    github: 'GitHub:',
    contactEmail: 'E-mail küldése Dr. Porkoláb Ádámnak',
    websiteLink: 'Dr. Porkoláb Ádám profiloldala (megnyílik egy új lapon)',
    githubLink: 'GitHub profil (megnyílik egy új lapon)',

    // Error messages
    errors: {
      validation: 'Érvénytelen adat. Kérjük, ellenőrizze a bevitt értékeket.',
      network: 'Hálózati hiba történt. Kérjük, próbálja újra később.',
      audio: 'Hang lejátszási hiba. Ellenőrizze a hang beállításokat.',
      gameLogic: 'Hiba történt a játék során. A játék automatikusan újraindul.',
      ui: 'Megjelenítési hiba történt. Kérjük, frissítse az oldalt.',
      storage: 'Adattárolási hiba. Ellenőrizze a böngésző beállításait.',
      generic: 'Váratlan hiba történt. Kérjük, próbálja újra.',
      colorComparison: 'Hiba történt a színek összehasonlítása során.',
      audioPlayback: 'Hangfájl hiba: ',
      audioError: 'Hiba történt a hang lejátszása közben.',
    },
  },

  en: {
    // Game UI
    gameTitle: 'Tonetracker v.2.0.0',
    gameDescription:
      'Color recognition game: memorize a color, then try to reproduce it using hex codes or RGB values.',

    // Controls
    checkButton: 'Check',
    computerTipButton: 'Computer Tip',
    newGameButton: 'New Game',
    closeButton: 'Close',

    // Input labels
    hexColorInput: 'Enter hex color code',
    hexColorPlaceholder: 'Enter hex color code (e.g. ff5733)',
    hexColorHelp: 'Six-character hex code, for example ff5733.',
    colorAdjustLabel: 'Adjust color:',
    colorAdjustHelp: 'Direct hex color code editing.',
    difficultyLabel: 'Difficulty level:',
    difficultyHelp:
      'The difficulty level determines the number of available tips.',

    // Difficulty levels
    difficultyEasy: 'Easy (3 tips)',
    difficultyMedium: 'Medium (2 tips)',
    difficultyHard: 'Hard (1 tip)',

    // Color components
    colorComponents: 'Color components:',
    redChannel: 'Red',
    greenChannel: 'Green',
    blueChannel: 'Blue',
    increaseValue: 'Increase {{channel}} value by 1',
    decreaseValue: 'Decrease {{channel}} value by 1',

    // ARIA labels
    skipToMain: 'Skip to main content',
    gameArea: 'Game area',
    colorComparison: 'Color comparison area',
    targetColor: 'Target color to memorize',
    userColor: 'Your chosen color',
    targetColorHelp:
      'This color appears for 3 seconds. Memorize it and try to reproduce it.',
    gameControls: 'Game control buttons',
    gameStats: 'Game statistics',
    rgbControls: 'RGB values fine-tuning',
    creatorInfo: 'Creator information',

    // Button help texts
    checkButtonHelp: 'Checks the entered color code and provides feedback.',
    computerTipHelp: 'Computer-generated tip for the correct color.',
    newGameHelp: 'Start a new game - a random color appears for 3 seconds.',

    // Feedback messages
    memorizeColor: 'Memorize the color!',
    congratulations: 'Congratulations! You got it!',
    sorry: "Sorry, you didn't get it.",
    tryAgain: 'Try again! You have {{count}} more attempts left. ',
    noMoreTips: 'No more tips',
    computerTip: 'Computer tip ({{count}} remaining)',
    invalidColor: 'Invalid color code, reset to default.',

    // Color comparison feedback
    colorAccuracy: 'Your guess is {{percentage}}% accurate.',
    veryClose: 'Very close!',
    goodProgress: "You're on the right track!",
    needsWork: 'Not bad, but you need to work on it.',
    farOff: "You're quite far from the correct color.",

    // Game stats
    time: 'Time',
    elapsedTime: 'Elapsed time',
    score: 'Score',
    currentScore: 'Current score',
    seconds: 'seconds',

    // Modal
    gameResult: 'Game Result',
    correctColorCode: 'The correct color code:',
    closeModal: 'Close window',

    // Time formatting
    timeFormat: {
      hours: 'hours',
      minutes: 'minutes',
      seconds: 'seconds',
    },

    // Creator info
    creatorName: 'Dr. Ádám Porkoláb',
    creatorTitle: 'Master of Digital Colors',
    creatorBio:
      "When not cracking color codes, he invents new methods for chasing virtual rainbows. Consistently competing for the 'Hex-code Breaker' title, breaking the secrets of colorful worlds with his keyboard.",
    contact: 'Contact:',
    website: 'Website:',
    github: 'GitHub:',
    contactEmail: 'Send email to Dr. Ádám Porkoláb',
    websiteLink: "Dr. Ádám Porkoláb's website (opens in new tab)",
    githubLink: 'GitHub profile (opens in new tab)',

    // Error messages
    errors: {
      validation: 'Invalid data. Please check the entered values.',
      network: 'Network error occurred. Please try again later.',
      audio: 'Audio playback error. Check your sound settings.',
      gameLogic: 'Game error occurred. The game will restart automatically.',
      ui: 'Display error occurred. Please refresh the page.',
      storage: 'Data storage error. Check your browser settings.',
      generic: 'Unexpected error occurred. Please try again.',
      colorComparison: 'Error occurred during color comparison.',
      audioPlayback: 'Audio file error: ',
      audioError: 'Error occurred during audio playback.',
    },
  },
};

/**
 * I18n class for internationalization support
 */
export class I18n {
  constructor() {
    this.currentLocale = this.detectLocale();
    this.translations = translations;
    this.fallbackLocale = 'en';

    // Cache for performance
    this.cache = new Map();
  }

  /**
   * Initialize i18n with given or detected locale
   * @param {string} locale - Optional locale to set
   */
  async initialize(locale) {
    if (locale && this.isLocaleSupported(locale)) {
      this.setLocale(locale);
    } else {
      this.setLocale(this.detectLocale());
    }
    return Promise.resolve();
  }

  /**
   * Detect user's preferred locale
   * @private
   * @returns {string} Detected locale
   */
  detectLocale() {
    // Check localStorage first
    const saved = localStorage.getItem('tonetracker_locale');
    if (saved && this.isLocaleSupported(saved)) {
      return saved;
    }

    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0];

    if (this.isLocaleSupported(langCode)) {
      return langCode;
    }

    // Default to Hungarian (original language)
    return 'hu';
  }

  /**
   * Check if locale is supported
   * @param {string} locale - Locale code to check
   * @returns {boolean} Whether locale is supported
   */
  isLocaleSupported(locale) {
    return (
      locale &&
      this.translations &&
      typeof this.translations === 'object' &&
      locale in this.translations
    );
  }

  /**
   * Get available locales
   * @returns {Array<string>} Array of supported locale codes
   */
  getAvailableLocales() {
    return Object.keys(this.translations);
  }

  /**
   * Set current locale
   * @param {string} locale - Locale code to set
   * @throws {ToneTrackerError} When locale is not supported
   */
  setLocale(locale) {
    if (!this.isLocaleSupported(locale)) {
      throw new ToneTrackerError(
        `Unsupported locale: ${locale}`,
        ERROR_CATEGORIES.VALIDATION,
        ERROR_LEVELS.ERROR,
        { locale, supportedLocales: this.getAvailableLocales() }
      );
    }

    this.currentLocale = locale;
    this.cache.clear(); // Clear cache when locale changes

    // Save to localStorage
    localStorage.setItem('tonetracker_locale', locale);

    // Update document language
    document.documentElement.lang = locale;

    // Dispatch event for components to react
    window.dispatchEvent(
      new CustomEvent('localeChanged', {
        detail: { locale, previousLocale: this.currentLocale },
      })
    );
  }

  /**
   * Get current locale
   * @returns {string} Current locale code
   */
  getCurrentLocale() {
    return this.currentLocale;
  }

  /**
   * Alias for getCurrentLocale for compatibility
   */
  getCurrentLanguage() {
    return this.getCurrentLocale();
  }

  /**
   * Translate a key with optional interpolation
   * @param {string} key - Translation key (dot notation supported)
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  t(key, params = {}) {
    // Check cache first
    const cacheKey = `${this.currentLocale}:${key}:${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let translation = this.getTranslation(key, this.currentLocale);

    // Fallback to fallback locale if not found
    if (translation === key && this.currentLocale !== this.fallbackLocale) {
      translation = this.getTranslation(key, this.fallbackLocale);
    }

    // Interpolate parameters
    if (params && typeof translation === 'string') {
      translation = this.interpolate(translation, params);
    }

    // Cache result
    this.cache.set(cacheKey, translation);

    return translation;
  }

  /**
   * Get translation for a specific locale
   * @private
   * @param {string} key - Translation key
   * @param {string} locale - Locale code
   * @returns {string} Translation or key if not found
   */
  getTranslation(key, locale) {
    const localeTranslations = this.translations[locale];
    if (!localeTranslations) {
      return key;
    }

    // Support dot notation (e.g., 'errors.validation')
    const keys = key.split('.');
    let value = localeTranslations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Key not found
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Interpolate parameters in translation string
   * @private
   * @param {string} template - Template string with {{param}} placeholders
   * @param {Object} params - Parameters to interpolate
   * @returns {string} Interpolated string
   */
  interpolate(template, params) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(params, key)
        ? String(params[key])
        : match;
    });
  }

  /**
   * Format time according to locale
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const timeFormat = this.t('timeFormat');
    let parts = [];

    if (hours > 0) {
      parts.push(`${hours} ${timeFormat.hours}`);
    }
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes} ${timeFormat.minutes}`);
    }
    parts.push(`${secs} ${timeFormat.seconds}`);

    return parts.join(' ');
  }

  /**
   * Format percentage for display
   * @param {number} percentage - Percentage value
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage
   */
  formatPercentage(percentage, decimals = 2) {
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Get localized error message
   * @param {string} errorType - Error type from ERROR_CATEGORIES
   * @returns {string} Localized error message
   */
  getErrorMessage(errorType) {
    const key = `errors.${errorType}`;
    const message = this.t(key);
    return message !== key ? message : this.t('errors.generic');
  }

  /**
   * Create a language switcher
   * @param {HTMLElement} container - Container element for language switcher
   */
  /**
   * Create a language switcher element
   * If a function is passed, it will be used as onChange callback and the element will be returned.
   * If a DOM element is passed, the switcher will be appended to it.
   * @param {Function|HTMLElement} target - onChange callback or container element
   * @returns {HTMLElement} The created switcher element
   */
  createLanguageSwitcher(target) {
    const container = document.createElement('div');
    container.className = 'language-switcher d-flex align-items-center';

    const label = document.createElement('label');
    label.textContent = this.t('language') || 'Language';
    label.htmlFor = 'language-switcher';
    label.style.marginRight = '8px';

    const select = document.createElement('select');
    select.id = 'language-switcher';
    select.setAttribute(
      'aria-label',
      this.t('languageSelector') || 'Language selector'
    );

    const localeNames = {
      hu: 'Magyar',
      en: 'English',
    };

    this.getAvailableLocales().forEach((locale) => {
      const option = document.createElement('option');
      option.value = locale;
      option.textContent = localeNames[locale] || locale.toUpperCase();
      option.selected = locale === this.currentLocale;
      select.appendChild(option);
    });

    select.addEventListener('change', (event) => {
      const prev = this.currentLocale;
      this.setLocale(event.target.value);
      if (typeof target === 'function') {
        target(event.target.value, prev);
      }
    });

    container.appendChild(label);
    container.appendChild(select);

    // Update on locale change
    window.addEventListener('localeChanged', () => {
      label.textContent = this.t('language') || 'Language';
      select.setAttribute(
        'aria-label',
        this.t('languageSelector') || 'Language selector'
      );
    });

    if (target && target instanceof HTMLElement) {
      target.appendChild(container);
    }
    return container;
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 1000, // Could be configurable
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
    };
  }
}

// Export singleton instance
export const i18n = new I18n();

// Convenience function for translation
export const t = (key, params) => i18n.t(key, params);
