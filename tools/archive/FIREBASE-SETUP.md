# ShuttleStats v2 - Firebase Setup Guide

This guide will walk you through setting up Firebase for ShuttleStats v2's authentication and database functionality.

## Phase 7 Implementation Status ✅

The following has been implemented:

### ✅ Completed

- **Firebase SDK Integration**: Added Firebase v10 modular SDK to the project
- **Firebase Configuration File**: Created `firebase-config.js` with proper exports
- **Authentication System**:
  - Email/Password sign-up with validation
  - Email/Password sign-in
  - Google Sign-In integration
  - Comprehensive error handling
  - User data storage in Firestore
- **Form Integration**: Updated `login.js` with Firebase Auth and Firestore operations
- **User Document Structure**: Implements the exact structure from API_CHECKLIST.md

### 🔄 Next Steps (You Need to Complete)

1. Create Firebase project in console
2. Enable Authentication and Firestore
3. Update configuration values
4. Test the authentication flow

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `shuttlestats-v2` (or your preferred name)
4. **Disable Google Analytics** for this project (unless needed)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle **"Enable"** to ON
   - Click **"Save"**
5. Enable **"Google"** (optional but recommended):
   - Click on "Google"
   - Toggle **"Enable"** to ON
   - Enter your project support email
   - Click **"Save"**

## Step 3: Enable Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. **IMPORTANT**: Select **"Start in production mode"**
   - We'll set up security rules later
4. Choose a location (select closest to your users)
5. Click **"Done"**

## Step 4: Get Web App Configuration

1. Click the **gear icon** (Settings) in the left sidebar
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click **"Add app"** and select the **web icon** `</>`
5. Enter app nickname: `ShuttleStats v2`
6. **Do NOT check** "Set up Firebase Hosting" (not needed yet)
7. Click **"Register app"**
8. **Copy the firebaseConfig object** - it will look like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
};
```

## Step 5: Update Configuration

1. Open `Public/js/firebase-config.js`
2. Replace the placeholder `firebaseConfig` object with your actual configuration
3. Save the file

**Before:**

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  // ... other placeholder values
};
```

**After:**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "shuttlestats-v2.firebaseapp.com",
  projectId: "shuttlestats-v2",
  storageBucket: "shuttlestats-v2.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
};
```

## Step 6: Set Up Firestore Security Rules

1. Go back to **"Firestore Database"**
2. Click **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Training sessions - users can access their own data
    match /training/{sessionId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.playerId ||
         request.auth.uid == resource.data.coachId);
      allow create: if request.auth != null;
    }

    // Matches - users can access their own data
    match /matches/{matchId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.playerId ||
         request.auth.uid == resource.data.coachId);
      allow create: if request.auth != null;
    }

    // Goals - users can access their own data
    match /goals/{goalId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.playerId ||
         request.auth.uid == resource.data.coachId);
      allow create: if request.auth != null;
    }

    // Schedule events - users can access events they participate in or created
    match /schedule/{eventId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.createdBy ||
         request.auth.uid in resource.data.participants);
      allow create: if request.auth != null;
    }

    // Coach-player relationships
    match /coach_players/{relationId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.coachId ||
         request.auth.uid == resource.data.playerId);
      allow create: if request.auth != null;
    }
  }
}
```

4. Click **"Publish"**

## Step 7: Test Your Setup

1. Start your local server:

   ```powershell
   cd "c:\Users\User\OneDrive\Desktop\shuttlestats-v2\Public"
   python -m http.server 8000
   ```

2. Open http://localhost:8000 in your browser
3. Navigate to the login page
4. Try creating a new account:
   - Fill out the sign-up form
   - Check the browser console for success/error messages
   - If successful, you should be redirected to the appropriate dashboard

## Troubleshooting

### Common Issues:

**"Firebase config not found" error:**

- Make sure you've replaced all placeholder values in `firebase-config.js`
- Ensure the configuration object is properly formatted

**"Auth domain not authorized" error:**

- In Firebase Console > Authentication > Settings
- Add your local domain (`localhost:8000`) to authorized domains

**"Project not found" error:**

- Double-check the `projectId` in your config
- Ensure the Firebase project exists and is accessible

**Network errors:**

- Check your internet connection
- Verify Firebase services are enabled (not down)

### Verification Steps:

1. **Check Browser Console**: Look for Firebase initialization logs
2. **Test Sign-up**: Create a test account and check if user appears in Firebase Auth
3. **Check Firestore**: Verify user document is created in the `users` collection
4. **Test Sign-in**: Try logging in with the created account

## Data Structure

The Firebase implementation follows the exact data structure specified in `API_CHECKLIST.md`:

### Users Collection

```javascript
{
  id: "firebase-auth-uid",
  name: {
    first: "John",
    middle: "Michael", // or null
    last: "Doe"
  },
  email: "john.doe@email.com",
  role: "player" | "coach",
  coachEmail: "coach@email.com" | null,
  status: "active",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## What's Next?

After completing this setup, your authentication system will be fully functional with:

- ✅ User sign-up with email/password
- ✅ User sign-in with email/password
- ✅ Google Sign-In (if enabled)
- ✅ User data stored in Firestore
- ✅ Role-based dashboard redirection
- ✅ Comprehensive error handling

The next phase will involve integrating Firebase with the other modules (training, matches, goals, schedule, etc.).

---

**Need Help?**

- Check the browser console for detailed error messages
- Verify all Firebase services are properly enabled
- Ensure your configuration values are correct
- Make sure security rules are published
