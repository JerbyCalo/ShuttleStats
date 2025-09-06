# ShuttleStats - Deployment Guide

A comprehensive badminton training and performance tracking web application.

## 🚀 Quick Deploy to Vercel

### Prerequisites

- Git repository with your ShuttleStats code
- Vercel account (free)
- Firebase project with web configuration

### Step-by-Step Deployment

1. **Push to GitHub/GitLab/Bitbucket**

   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy on Vercel**

   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect the configuration from `vercel.json`
   - Click "Deploy"

3. **Configure Environment Variables** (if needed)
   - Go to Project Settings → Environment Variables
   - Add any additional environment variables

### Manual Deployment (Alternative)

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Deploy**

   ```bash
   vercel
   ```

3. **Follow the prompts and your app will be live!**

## 📁 Project Structure

```
shuttlestats/
├── Public/                 # All web files (HTML, CSS, JS)
│   ├── index.html         # Landing page
│   ├── login.html         # Authentication
│   ├── *-dashboard.html   # User dashboards
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript modules
│   ├── assets/           # Images, icons
│   └── config/           # Firebase configuration
├── vercel.json           # Vercel deployment config
├── package.json          # Project metadata
├── build.js             # Optional build script
└── .vercelignore        # Deployment exclusions
```

## 🔧 Configuration Files

- **vercel.json**: Handles routing for the multi-page application
- **package.json**: Project metadata and scripts
- **build.js**: Optional build process for clean deployment

## 🌐 Live URLs

After deployment, your app will be available at:

- Main site: `https://your-app-name.vercel.app`
- Login: `https://your-app-name.vercel.app/login`
- Player Dashboard: `https://your-app-name.vercel.app/player-dashboard`
- Coach Dashboard: `https://your-app-name.vercel.app/coach-dashboard`

## 🔥 Firebase Configuration

Ensure your `Public/config/firebase-config.js` has the correct Firebase project configuration for production.

## 📱 Features

- **Role-based Access**: Separate interfaces for coaches and players
- **Training Management**: Log sessions, set goals, track progress
- **Match Tracking**: Record match results and statistics
- **Scheduling**: Manage training schedules and reminders
- **Player Management**: Coach-player relationships and invitations
- **Performance Analytics**: Progress tracking and achievement system

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📞 Support

For support or questions, contact: support@shuttlestats.app
