# 📖 GitHub Pages Setup Guide

Quick reference for setting up and managing GitHub Pages for ToneTracker.

## 🚀 Initial Setup

### 1. Enable GitHub Pages

1. Go to your repository **Settings**
2. Scroll down to **Pages** section
3. Under **Source**, select "Deploy from a branch"
4. Select branch: **gh-pages** (created automatically by CI/CD)
5. Folder: **/ (root)**
6. Click **Save**

### 2. Configure Custom Domain

1. In the **Pages** settings, under **Custom domain**
2. Enter: `tonetracker.app`
3. Click **Save**
4. Wait for DNS check to complete
5. Enable **Enforce HTTPS** (after DNS propagation)

### 3. Verify DNS Settings

Check that your domain DNS records are configured correctly:

```bash
# Check A records for apex domain
dig tonetracker.app A

# Check CNAME for www subdomain  
dig www.tonetracker.app CNAME
```

Expected results:
- **A records**: Should point to GitHub Pages IPs (185.199.108-111.153)
- **CNAME record**: Should point to `dr.porkolabadam.github.io`

## 📋 Repository Configuration

### Required Files

✅ **CNAME** (repository root)
```
tonetracker.app
```

✅ **.github/workflows/ci-cd.yml** (GitHub Actions workflow)

✅ **vite.config.js** with proper base path:
```javascript
export default defineConfig({
  base: './'  // Important for GitHub Pages
})
```

### GitHub Pages Settings Overview

| Setting | Value | Purpose |
|---------|-------|---------|
| Source | Deploy from a branch | Use gh-pages branch |
| Branch | gh-pages | Auto-created by CI/CD |
| Custom domain | tonetracker.app | Your domain |
| Enforce HTTPS | ✅ Enabled | Security |

## 🔧 Troubleshooting

### Common Issues and Solutions

#### ❌ "Site not found" or 404 errors

**Possible causes:**
- DNS not propagated yet (wait 24-48 hours)
- CNAME file missing or incorrect
- GitHub Pages not enabled
- Wrong branch selected

**Solutions:**
```bash
# Check if gh-pages branch exists
git branch -r | grep gh-pages

# Verify CNAME file content
cat CNAME

# Test DNS resolution
nslookup tonetracker.app
```

#### ❌ "There isn't a GitHub Pages site here"

**Possible causes:**
- Repository is private (upgrade to GitHub Pro or make public)
- GitHub Pages disabled
- No content in gh-pages branch

**Solutions:**
1. Make repository public, or
2. Upgrade to GitHub Pro for private repo pages
3. Run deployment pipeline to create gh-pages content

#### ❌ Custom domain not working

**Check these items:**
- [ ] CNAME file exists in repository root
- [ ] DNS A records point to correct GitHub IPs
- [ ] WWW CNAME points to username.github.io
- [ ] Wait 24-48 hours for DNS propagation
- [ ] "Enforce HTTPS" enabled after DNS works

#### ❌ Build/Deploy failures

**Debug steps:**
1. Check **Actions** tab for error details
2. Verify Node.js version (should be 22.12+)
3. Test build locally: `npm run build`
4. Check if all dependencies are installed

### DNS Verification Commands

```bash
# Quick DNS check
nslookup tonetracker.app

# Detailed DNS lookup
dig tonetracker.app A +short
dig www.tonetracker.app CNAME +short

# Check from different DNS servers
dig @8.8.8.8 tonetracker.app A
dig @1.1.1.1 tonetracker.app A
```

## 📊 Monitoring

### Check Deployment Status

1. **Actions Tab**: View CI/CD pipeline runs
2. **Pages Settings**: See deployment status and domain verification
3. **Live Site**: Visit https://tonetracker.app

### Performance Monitoring

The CI/CD pipeline automatically runs:
- 🔍 Bundle size analysis
- 🚨 Lighthouse performance audit  
- 📊 Test coverage reports

View results in the **Actions** tab under each workflow run.

## 🔧 Advanced Configuration

### Environment Variables

Available in deployment:
- `NODE_ENV=production`
- `__APP_VERSION__` - From package.json version
- `__BUILD_TIME__` - ISO timestamp of build
- `__DEV__` - false in production

### Custom 404 Page

Create `public/404.html` to customize the 404 error page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Page Not Found - ToneTracker</title>
  <meta http-equiv="refresh" content="3;url=/">
</head>
<body>
  <h1>Page Not Found</h1>
  <p>Redirecting to home page...</p>
</body>
</html>
```

### Security Headers

GitHub Pages automatically provides:
- HTTPS enforcement
- Basic security headers
- DDoS protection

## 📞 Support

If you encounter issues:

1. **Check the docs**: [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
2. **Review logs**: GitHub Actions tab for deployment errors
3. **DNS tools**: Use online DNS checkers for domain issues
4. **GitHub Support**: For GitHub Pages specific issues

## 📚 Quick Links

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Custom Domain Guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [DNS Configuration Help](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

---

**Quick Status Check**: Visit https://tonetracker.app to verify deployment! 🎉
