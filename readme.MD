# 🎨 ToneTracker v2.0.0

[![CI/CD Status](https://github.com/APorkolab/ToneTracker/workflows/🚀%20ToneTracker%20CI/CD/badge.svg)](https://github.com/APorkolab/ToneTracker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://web.dev/progressive-web-apps/)
[![Performance](https://img.shields.io/badge/Performance-A%2B-green.svg)](https://developers.google.com/speed/pagespeed/insights/)

> **A challenging color matching game that tests your ability to recognize and reproduce colors accurately**

ToneTracker is a modern, progressive web application that challenges players to memorize and reproduce colors using hex codes or RGB adjustments. Built with enterprise-grade architecture featuring analytics, performance monitoring, offline support, and comprehensive accessibility features.

## 🌟 Features

### 🎮 Core Gameplay
- **Memory Challenge**: Memorize a color displayed for 3 seconds
- **Multiple Input Methods**: Hex code input, RGB component adjustments, or color picker
- **Difficulty Levels**: Easy (3 tips), Medium (2 tips), Hard (1 tip)
- **Computer Tips**: AI-generated color suggestions with varying accuracy
- **Real-time Feedback**: Color comparison with Delta E accuracy calculations

### 📱 Progressive Web App (PWA)
- **Offline Play**: Full functionality without internet connection
- **Installable**: Add to home screen on any device
- **Service Worker**: Intelligent caching and background sync
- **Push Notifications**: Game updates and achievements
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### 📊 Advanced Analytics
- **Privacy-First**: All data stored locally with GDPR compliance
- **Performance Tracking**: FPS monitoring, memory usage, load times
- **Game Statistics**: Win rate, accuracy, best scores, play time
- **User Behavior**: Feature usage, error tracking, session management
- **Achievement System**: Milestone celebrations and progress tracking

### 🌍 Accessibility & Internationalization
- **Screen Reader Support**: Full ARIA labels and semantic HTML
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Support for accessibility preferences
- **Multi-language**: English and Hungarian with easy expansion
- **Reduced Motion**: Respects user motion preferences

### ⚡ Performance & Quality
- **Sub-second Loading**: Optimized assets and intelligent caching
- **Memory Leak Detection**: Automatic monitoring and reporting
- **Error Boundaries**: Graceful error handling and recovery
- **Code Splitting**: Lazy-loaded modules for faster initial load
- **Bundle Optimization**: Tree-shaking and minification

## 🧰 Tech Stack

| Area | Tooling |
|------|---------|
| Runtime | Vanilla JavaScript (ES modules), HTML, CSS, Service Worker |
| Build | Vite 8 (Rolldown, Oxc minifier) |
| Unit tests | Vitest 5 + happy-dom 21, `@testing-library/jest-dom` 7, V8 coverage |
| E2E tests | Playwright 1.64 (Chromium) |
| Quality | ESLint 10 (flat config), Prettier 3 |
| CI/CD | GitHub Actions (Node 24), GitHub Pages deployment |

### Prerequisites

- **Node.js 22.12+** (Node 24 LTS recommended; the version used in CI) and npm
- **Python 3** only for `npm run serve` (optional static server)
- No environment variables or secrets are needed for local development. CI optionally uses the `CODECOV_TOKEN` repository secret for coverage upload.

## 🚀 Quick Start

### Development Setup

```bash
# Clone the repository
git clone https://github.com/APorkolab/ToneTracker.git
cd ToneTracker

# Install dependencies (exactly as locked)
npm ci

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Building for Production

```bash
# Build optimized version
npm run build

# Preview production build
npm run preview

# Serve static files (alternative)
npm run serve
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with HMR
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm test               # Run unit tests in watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Run tests with coverage (fails below 80%)
npm run e2e:install    # Download Playwright browsers (first run only)
npm run e2e            # Build, start preview server and run E2E tests
npm run e2e:ui         # Run E2E tests with UI

# Quality Assurance
npm run lint           # Lint JavaScript files
npm run format         # Format code with Prettier
npm run format:check   # Verify formatting without writing (used in CI)
npm run security:audit # Security vulnerability check

# Performance
npm run performance:audit  # Lighthouse audit
npm run analyze           # Bundle size analysis
npm run size:check       # Check bundle size limits
```

### Testing

Unit tests live in `tests/unit/` (`*.test.js`, run by Vitest), end-to-end tests in `tests/e2e/` (`*.e2e.js`, run by Playwright against the production preview on port 4173). The CI pipeline runs lint, the format check, unit tests with coverage and the E2E suite on every push and pull request; deployment to GitHub Pages only happens from `main`.

## 🎯 Game Architecture

### Core Systems

#### 🎮 Game Engine
- **State Management**: Immutable state with time-travel debugging
- **Game Loop**: Timer-based gameplay with pause/resume
- **Scoring System**: Time-based scoring with difficulty multipliers
- **Achievement Engine**: Milestone tracking and notifications

#### 🎨 Color Science
- **Delta E Calculations**: CIE76 color difference algorithm
- **Color Space Conversions**: RGB ↔ XYZ ↔ Lab transformations
- **Accuracy Metrics**: Percentage-based similarity scoring
- **Color Generation**: Random color generation with distribution controls

#### 📊 Analytics Pipeline
- **Event Tracking**: Comprehensive user interaction logging
- **Performance Monitoring**: FPS, memory, and timing metrics
- **Error Reporting**: Automatic error categorization and reporting
- **Privacy Controls**: Opt-out mechanisms and data anonymization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dr. Porkoláb Ádám**

- 🌐 Website: [adamporkolab.hu](https://www.adamporkolab.hu)
- 📧 Email: [adam@porkolab.hu](mailto:adam@porkolab.hu)
- 💼 GitHub: [@APorkolab](https://github.com/APorkolab)

## 🙏 Acknowledgments

- **Color Science**: CIE color space standards
- **Accessibility**: WCAG 2.1 guidelines
- **Performance**: Web Vitals best practices
- **PWA**: Google PWA guidelines
- **Open Source**: Community contributions and feedback

---

<div align="center">

**Made with ❤️ and lots of ☕**

[🎮 Play ToneTracker](https://tonetracker.app) | [📖 Documentation](docs/) | [🐛 Report Bug](issues/) | [💡 Request Feature](issues/)

</div>
