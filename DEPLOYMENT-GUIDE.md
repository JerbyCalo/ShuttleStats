# 🚀 ShuttleStats - Vercel Deployment Guide

## Summary of Changes Made

### ✅ Files Created for Deployment:

1. **`vercel.json`** - Main configuration file that:

   - Routes all pages correctly (`/login` → `/Public/login.html`, etc.)
   - Handles static assets (CSS, JS, images)
   - Adds security headers
   - Enables clean URLs and proper caching

2. **`.vercelignore`** - Excludes unnecessary files from deployment:

   - Development tools and archives
   - IDE files and system files
   - Git and documentation files (optional)

3. **`package.json`** - Project metadata with:

   - Scripts for development and building
   - Project information
   - Node.js version requirements

4. **`build.js`** - Optional build script that:

   - Copies files from `Public/` to `dist/` for clean builds
   - Can be used for any preprocessing needed

5. **`README.md`** - Complete deployment and project documentation

## 🎯 Step-by-Step Deployment Guide

### Option 1: GitHub + Vercel (Recommended)

1. **Initialize Git Repository (if not already done)**

   ```powershell
   git init
   git add .
   git commit -m "Initial commit - ShuttleStats ready for deployment"
   ```

2. **Create GitHub Repository**

   - Go to [GitHub.com](https://github.com)
   - Click "New Repository"
   - Name it `shuttlestats`
   - Don't initialize with README (you already have one)
   - Click "Create repository"

3. **Push to GitHub**

   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/shuttlestats.git
   git branch -M main
   git push -u origin main
   ```

4. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com) and sign up/login
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the `vercel.json` configuration
   - Click "Deploy"
   - Your app will be live in ~30 seconds!

### Option 2: Direct CLI Deployment

1. **Install Vercel CLI**

   ```powershell
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```powershell
   vercel login
   ```

3. **Deploy**

   ```powershell
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No** (first deployment)
   - Project name? **shuttlestats** or your preferred name
   - Directory? **Press Enter** (current directory)
   - Auto-detected settings okay? **Yes**

## 🔧 Post-Deployment Configuration

### 1. Custom Domain (Optional)

- In Vercel dashboard → Project Settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

### 2. Environment Variables

- If you need any environment variables
- Go to Project Settings → Environment Variables
- Add variables for all environments (Production, Preview, Development)

### 3. Firebase Configuration

- Ensure your `Public/config/firebase-config.js` has production Firebase settings
- Make sure Firebase project allows your new Vercel domain in authorized domains

## 🌐 Your Live URLs

After deployment, your app will be available at:

- **Main Landing Page**: `https://your-app-name.vercel.app/`
- **Login**: `https://your-app-name.vercel.app/login`
- **Player Dashboard**: `https://your-app-name.vercel.app/player-dashboard`
- **Coach Dashboard**: `https://your-app-name.vercel.app/coach-dashboard`
- **All other pages**: `https://your-app-name.vercel.app/[page-name]`

## ✅ Pre-Deployment Checklist

- [ ] All HTML files are in `Public/` directory
- [ ] `Public/index.html` exists and works as landing page
- [ ] Firebase configuration is set for production
- [ ] All relative paths in HTML files are correct
- [ ] CSS and JS files load properly
- [ ] All required assets are in `Public/assets/`
- [ ] Git repository is initialized and pushed
- [ ] `vercel.json` configuration is in project root

## 🔥 Firebase Setup Reminders

1. **Authorized Domains**: Add your Vercel domain to Firebase Auth
2. **Firestore Rules**: Ensure production-ready security rules
3. **Firebase Config**: Use production Firebase project configuration

## 🛠️ Development Commands

```powershell
# Start local development server
npm run dev

# Build the project (optional)
npm run build

# Preview production build locally
npm run preview
```

## 📞 Troubleshooting

### Common Issues:

1. **404 on page refresh**: Fixed by `vercel.json` routing configuration
2. **CSS/JS not loading**: Check paths in `vercel.json` routes
3. **Firebase errors**: Verify domain is authorized in Firebase Console

### Need Help?

- Check Vercel deployment logs in dashboard
- Ensure all file paths are correct and case-sensitive
- Verify Firebase project settings match your domain

---

**Your ShuttleStats app is now ready for production deployment! 🚀**
