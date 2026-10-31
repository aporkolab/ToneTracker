# 🚀 ToneTracker Deployment Guide

This guide explains how ToneTracker is deployed using GitHub Pages with a custom domain and automated CI/CD pipeline.

## 🏗️ Deployment Architecture

ToneTracker uses a modern deployment pipeline with the following components:

- **Build System**: Vite for optimized production builds
- **Hosting**: GitHub Pages for static site hosting
- **CI/CD**: GitHub Actions for automated deployment
- **Custom Domain**: `tonetracker.app` with HTTPS
- **Performance**: Bundle optimization and lighthouse auditing

## 📋 Prerequisites

Before deployment, ensure you have:

1. **Repository Access**: Write access to the ToneTracker GitHub repository
2. **Domain Setup**: DNS records properly configured for `tonetracker.app`
3. **GitHub Pages**: Enabled in repository settings
4. **Node.js**: Version 22.12+ (Node 24 LTS recommended, used in CI) for local development and testing

## 🔧 Configuration Files

### 1. GitHub Actions Workflow (`.github/workflows/ci-cd.yml`)

The CI/CD pipeline consists of four main jobs:

#### **Quality Job** 🔍
- Runs ESLint and Prettier checks (`npm run lint`, `npm run format:check`)
- Executes unit tests with Vitest and enforces the 80% coverage thresholds
- Uploads the LCOV coverage report to Codecov
- Performs a security audit (`npm audit`, reported but non-blocking)

#### **E2E Job** 🎭
- Runs Playwright end-to-end tests
- Tests production build functionality
- Uploads test artifacts on failure

#### **Deploy Job** 🚀
- Builds production-optimized bundle
- Copies CNAME file to dist directory
- Validates build output
- Reports bundle sizes in the step summary
- Runs Lighthouse performance audit
- Deploys to GitHub Pages with custom domain
- Uploads build and performance artifacts

#### **Notify Job** 📢
- Sends deployment status notifications
- Updates GitHub Step Summary with results

### 2. CNAME File

The `CNAME` file in the repository root contains:
```
tonetracker.app
```

This file is automatically copied to the `dist` directory during build and tells GitHub Pages to use the custom domain.

### 3. Vite Configuration (`vite.config.js`)

Key deployment configurations:

```javascript
export default defineConfig({
  base: './',  // Relative base path for GitHub Pages
  build: {
    outDir: 'dist',  // Output directory for GitHub Pages
    assetsDir: 'assets',  // Asset organization
    sourcemap: true,  // Source maps for debugging
    // Code splitting (Vite 8 / Rolldown)
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [ /* game, utils, features chunks */ ]
        }
      }
    }
  }
})
```

## 🚀 Deployment Process

### Automatic Deployment

Deployment happens automatically when:

1. **Push to main branch**: Triggers the full CI/CD pipeline including deployment
2. **Push to any other branch / pull request to main**: Runs quality checks and E2E tests (no deployment)

The workflow has no manual (`workflow_dispatch`) trigger; to redeploy, push or merge to `main`, or re-run the latest `main` run from the **Actions** tab.

### Local Build Testing

To test the production build locally:

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Preview the production build
npm run preview

# Or serve the dist directory
npm run serve
```

## 🌐 Custom Domain Setup

### DNS Configuration

For `tonetracker.app` to work with GitHub Pages, configure these DNS records:

#### **Apex Domain** (tonetracker.app):
```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

#### **WWW Subdomain** (www.tonetracker.app):
```
Type: CNAME
Name: www
Value: dr.porkolabadam.github.io
```

### GitHub Pages Settings

1. Go to repository **Settings** > **Pages**
2. Source should be set to **Deploy from a branch**
3. Branch should be **gh-pages** (automatically created by the action)
4. Custom domain should show **tonetracker.app**
5. **Enforce HTTPS** should be enabled

## 📊 Performance Monitoring

The deployment pipeline includes several performance checks:

### Bundle Size Analysis
- Maximum JavaScript bundle size: **250kb** (gzipped)
- Maximum CSS bundle size: **50kb** (gzipped)
- Warnings appear in CI if limits are exceeded

### Lighthouse Audits
- Performance score monitoring
- Accessibility checks
- SEO validation
- Best practices compliance

### Performance Budgets

Configure in `bundlesize.config.json` and check locally with `npm run size:check` after a build:

```json
{
  "files": [
    { "path": "dist/assets/features-*.js", "maxSize": "50kb", "compression": "gzip" },
    { "path": "dist/assets/game-*.js", "maxSize": "15kb", "compression": "gzip" },
    { "path": "dist/assets/index-*.js", "maxSize": "15kb", "compression": "gzip" },
    { "path": "dist/assets/index-*.css", "maxSize": "30kb", "compression": "gzip" }
  ]
}
```

## 🐛 Troubleshooting

### Common Issues

#### **Deployment Fails**
1. Check the Actions tab for detailed error logs
2. Verify all required files exist in the build output
3. Ensure CNAME file is properly formatted
4. Check that GitHub Pages is enabled in repository settings

#### **Custom Domain Not Working**
1. Verify DNS records are correctly configured
2. Wait 24-48 hours for DNS propagation
3. Check that CNAME file contains only the domain name
4. Ensure HTTPS enforcement is enabled after DNS propagation

#### **Build Failures**
1. Check Node.js version compatibility (requires v22.12+)
2. Verify all dependencies are properly installed
3. Run tests locally to identify issues
4. Check ESLint and Prettier formatting

#### **Performance Issues**
1. Analyze bundle size reports in CI artifacts
2. Check Lighthouse reports for optimization suggestions
3. Review code splitting configuration in `vite.config.js`
4. Consider implementing lazy loading for non-critical features

### Debug Commands

```bash
# Test build locally
npm run build && npm run preview

# Run full test suite
npm run test:run

# Check code quality
npm run lint && npm run format:check

# Analyze bundle size
npm run analyze

# Run performance audit
npm run performance:audit
```

## 📈 Monitoring and Analytics

### Build Artifacts

Each deployment creates artifacts available for 30 days:

- **dist**: Complete build output
- **lighthouse-report**: Performance audit results
- **playwright-report**: E2E test results (on failure)
- **coverage**: Test coverage reports

### Performance Metrics

Monitor these key metrics:

- **Load Time**: Target < 3 seconds
- **Bundle Size**: JavaScript < 250kb, CSS < 50kb
- **Lighthouse Score**: Performance > 90
- **Test Coverage**: Maintain > 80%

## 🔒 Security Considerations

### Secrets Management

- Uses `GITHUB_TOKEN` (automatically provided)
- No additional secrets required for basic deployment
- Consider adding secrets for advanced analytics or monitoring

### Content Security

- Static site hosting reduces security surface
- HTTPS enforced through GitHub Pages
- Regular dependency updates through npm audit
- Automated security scanning in CI pipeline

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Lighthouse Performance Guide](https://developers.google.com/web/tools/lighthouse)

## 🤝 Contributing to Deployment

When making changes that affect deployment:

1. Test locally with `npm run build && npm run preview`
2. Update this documentation if configuration changes
3. Monitor deployment pipeline after merging changes
4. Check performance metrics don't regress

---

**Last Updated**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Version**: ToneTracker v2.0.0
