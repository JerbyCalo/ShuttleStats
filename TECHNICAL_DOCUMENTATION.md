# 🏗️ ShuttleStats Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Frontend Architecture](#frontend-architecture)
5. [Authentication & Security](#authentication--security)
6. [State Management](#state-management)
7. [Real-Time Features](#real-time-features)
8. [Deployment](#deployment)
9. [Performance Considerations](#performance-considerations)
10. [Development Workflow](#development-workflow)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HTML Pages (Multi-Page Application)                 │   │
│  │  - player-dashboard.html                             │   │
│  │  - coach-dashboard.html                              │   │
│  │  - training.html, matches.html, goals.html, etc.     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JavaScript Modules (ES6+)                           │   │
│  │  - Role-based UI components                          │   │
│  │  - Firebase SDK integration                          │   │
│  │  - Chart.js visualizations                           │   │
│  │  - Real-time listeners                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CSS Styling                                         │   │
│  │  - Responsive design                                 │   │
│  │  - Role-aware styling                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Firebase Authentication                             │   │
│  │  - Email/Password provider                           │   │
│  │  - Google OAuth provider                             │   │
│  │  - Session management                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cloud Firestore Database                            │   │
│  │  - NoSQL document database                           │   │
│  │  - Real-time synchronization                         │   │
│  │  - Security rules enforcement                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Security Rules                                      │   │
│  │  - Role-based access control                         │   │
│  │  - Data isolation                                    │   │
│  │  - Server-side validation                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    HOSTING LAYER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Vercel CDN                                          │   │
│  │  - Static file serving                               │   │
│  │  - HTTPS encryption                                  │   │
│  │  - Global edge network                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer              | Technology         | Version | Purpose                |
| ------------------ | ------------------ | ------- | ---------------------- |
| **Frontend**       | Vanilla JavaScript | ES6+    | Core application logic |
| **UI Framework**   | HTML5 + CSS3       | -       | User interface         |
| **Visualization**  | Chart.js           | 4.4.0   | Analytics dashboard    |
| **Backend**        | Firebase Firestore | 10.12.5 | NoSQL database         |
| **Authentication** | Firebase Auth      | 10.12.5 | User authentication    |
| **Hosting**        | Vercel             | -       | Static site hosting    |
| **Build**          | Node.js            | -       | Build scripts          |
| **Linting**        | ESLint             | 9.9.0   | Code quality           |
| **Formatting**     | Prettier           | 3.3.3   | Code formatting        |

### Architecture Pattern

**Multi-Page Application (MPA)**

- Each HTML page represents a distinct view
- JavaScript modules provide shared functionality
- No frontend framework (React, Vue, etc.)
- Direct Firebase SDK integration
- Role-based UI rendering

**Key Characteristics**:

- ✅ Simple deployment and hosting
- ✅ Fast initial page loads
- ✅ SEO-friendly (if needed)
- ✅ Easy to understand and maintain
- ✅ No build step required (optional build for optimization)
- ⚠️ Full page reloads on navigation
- ⚠️ No virtual DOM optimizations

---

## System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Player    │  │    Coach    │  │    Shared   │         │
│  │    Pages    │  │    Pages    │  │    Pages    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│        │                 │                 │                │
│        └─────────────────┴─────────────────┘                │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    APPLICATION LAYER                         │
├──────────────────────────┼──────────────────────────────────┤
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Core JavaScript Modules                     │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  • auth-utils.js      - Authentication helpers        │  │
│  │  • role-manager.js    - Role-based UI control         │  │
│  │  • navigation.js      - Sidebar & navigation          │  │
│  │  • modals.js          - Modal system (CRUD ops)       │  │
│  │  • loading.js         - Loading states & spinners     │  │
│  │  • toast.js           - Notification system           │  │
│  │  • user-greeting.js   - Header user display           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Feature-Specific Modules                      │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  • training.js        - Training session management   │  │
│  │  • matches.js         - Match tracking & analysis     │  │
│  │  • goals.js           - Goal setting & tracking       │  │
│  │  • schedule.js        - Calendar & events             │  │
│  │  • progress.js        - Analytics dashboard           │  │
│  │  • profile.js         - Profile management (inline)   │  │
│  │  • player-dashboard.js - Player main view             │  │
│  │  • coach-dashboard.js  - Coach main view              │  │
│  │  • my-players.js      - Coach roster management       │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                     DATA ACCESS LAYER                        │
├──────────────────────────┼───────────────────────────────────┤
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Firebase SDK Integration                   │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  firebase-config.js - Centralized Firebase setup      │  │
│  │                                                        │  │
│  │  Exports:                                              │  │
│  │  • auth, db - Service instances                       │  │
│  │  • Authentication methods                             │  │
│  │  • Firestore CRUD operations                          │  │
│  │  • Real-time listeners                                │  │
│  │  • Global auth state (window.currentUser)             │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                   PERSISTENCE LAYER                          │
├──────────────────────────┼───────────────────────────────────┤
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Firebase Services                        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  • Firebase Authentication                            │  │
│  │    - Email/Password auth                              │  │
│  │    - Google OAuth                                     │  │
│  │    - Session persistence                              │  │
│  │                                                        │  │
│  │  • Cloud Firestore                                    │  │
│  │    - users collection                                 │  │
│  │    - training collection                              │  │
│  │    - matches collection                               │  │
│  │    - goals collection                                 │  │
│  │    - schedule collection                              │  │
│  │    - coach_players collection                         │  │
│  │    - feedback collection                              │  │
│  │                                                        │  │
│  │  • Security Rules                                     │  │
│  │    - firestore.rules                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Player Logging Training Session

```
User Action (Click "Log Training")
    ↓
modals.js → openLogTrainingModal()
    ↓
Display modal with form
    ↓
User fills form and submits
    ↓
modals.js → handleTrainingSubmit()
    ↓
Firebase SDK → addDoc(collection(db, 'training'), data)
    ↓
Firestore Security Rules validate
    ↓
Document created in Firestore
    ↓
Real-time listener in training.js detects change
    ↓
training.js → renderTrainingSessions()
    ↓
UI updates with new training card
    ↓
toast.js → showSuccess("Training session logged!")
```

#### Coach Viewing Player Data

```
Coach selects player from dropdown
    ↓
coach-dashboard.js → updateDashboardUI(playerId)
    ↓
Fetch player data:
    - fetchPlayerTrainingSessions(playerId)
    - fetchPlayerMatches(playerId)
    - fetchPlayerGoals(playerId)
    ↓
Firestore applies security rules:
    - Verify coach has access to player
    ↓
Data returned to client
    ↓
Process and render:
    - renderTrainingCommitmentKPI()
    - renderCurrentFocusKPI()
    - renderRecentTraining()
    - renderUpcomingMatches()
    - renderCurrentGoals()
    ↓
UI displays player's performance data
```

---

## Database Schema

### Firestore Collections Structure

```
firestore (root)
│
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── firstName: string
│       ├── lastName: string
│       ├── name: string (computed: firstName + lastName)
│       ├── role: "player" | "coach"
│       ├── createdAt: timestamp
│       └── coachId: string (optional, for players)
│
├── training/
│   └── {sessionId}/
│       ├── playerId: string (userId)
│       ├── coachId: string (userId)
│       ├── date: string (YYYY-MM-DD)
│       ├── duration: number (minutes)
│       ├── type: "Drills" | "Match Play" | "Conditioning" | "Technique"
│       ├── intensity: number (1-10)
│       ├── notes: string
│       ├── createdAt: timestamp
│       └── sessionStart: timestamp (for sorting)
│
├── matches/
│   └── {matchId}/
│       ├── playerId: string (userId)
│       ├── coachId: string (userId)
│       ├── date: string (YYYY-MM-DD)
│       ├── opponent: string
│       ├── matchType: "Singles" | "Doubles"
│       ├── result: "Win" | "Loss" | "Draw"
│       ├── playerScore: string (e.g., "21-18, 21-19")
│       ├── opponentScore: string
│       ├── notes: string
│       └── createdAt: timestamp
│
├── goals/
│   └── {goalId}/
│       ├── playerId: string (userId)
│       ├── coachId: string (userId)
│       ├── title: string
│       ├── description: string
│       ├── category: "Skill" | "Fitness" | "Competitive" | "Other"
│       ├── priority: "Low" | "Medium" | "High"
│       ├── status: "Not Started" | "In Progress" | "Completed"
│       ├── targetDate: string (YYYY-MM-DD)
│       ├── progress: number (0-100, optional)
│       └── createdAt: timestamp
│
├── schedule/
│   └── {eventId}/
│       ├── createdBy: string (userId)
│       ├── userId: string (playerId or coachId)
│       ├── title: string
│       ├── date: string (YYYY-MM-DD)
│       ├── time: string (HH:MM, optional)
│       ├── type: "Training" | "Match"
│       ├── location: string (optional)
│       ├── notes: string (optional)
│       └── createdAt: timestamp
│
├── coach_players/
│   └── {relationId}/
│       ├── coachId: string (userId)
│       ├── playerId: string (userId, null if pending)
│       ├── playerEmail: string
│       ├── status: "pending" | "accepted"
│       ├── invitedAt: timestamp
│       └── acceptedAt: timestamp (optional)
│
└── feedback/
    └── {feedbackId}/
        ├── coachId: string (userId)
        ├── playerId: string (userId)
        ├── targetId: string (sessionId or matchId)
        ├── targetType: "training" | "match"
        ├── content: string
        └── createdAt: timestamp
```

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ email       │
│ firstName   │
│ lastName    │
│ role        │
│ createdAt   │
│ coachId (FK)│
└─────────────┘
      │
      │ 1:N (player has many training sessions)
      ↓
┌─────────────┐
│  Training   │
├─────────────┤
│ id (PK)     │
│ playerId(FK)│
│ coachId (FK)│
│ date        │
│ duration    │
│ type        │
│ intensity   │
│ notes       │
└─────────────┘
      │
      │ 1:N (training can have many feedback)
      ↓
┌─────────────┐
│  Feedback   │
├─────────────┤
│ id (PK)     │
│ coachId (FK)│
│ playerId(FK)│
│ targetId(FK)│
│ targetType  │
│ content     │
└─────────────┘

┌─────────────┐
│    User     │
│  (Player)   │
└─────────────┘
      │
      │ 1:N (player has many matches)
      ↓
┌─────────────┐
│   Matches   │
├─────────────┤
│ id (PK)     │
│ playerId(FK)│
│ coachId (FK)│
│ date        │
│ opponent    │
│ matchType   │
│ result      │
│ scores      │
└─────────────┘

┌─────────────┐
│    User     │
│  (Player)   │
└─────────────┘
      │
      │ 1:N (player has many goals)
      ↓
┌─────────────┐
│    Goals    │
├─────────────┤
│ id (PK)     │
│ playerId(FK)│
│ coachId (FK)│
│ title       │
│ category    │
│ priority    │
│ status      │
│ targetDate  │
└─────────────┘

┌─────────────┐        ┌─────────────────┐        ┌─────────────┐
│    User     │        │  CoachPlayers   │        │    User     │
│  (Coach)    │───────>│   (Junction)    │<───────│  (Player)   │
└─────────────┘  1:N   ├─────────────────┤   N:1  └─────────────┘
                       │ id (PK)         │
                       │ coachId (FK)    │
                       │ playerId (FK)   │
                       │ playerEmail     │
                       │ status          │
                       └─────────────────┘
```

### Indexes

**Recommended Composite Indexes** (for optimal query performance):

```javascript
// Collection: training
// Fields: playerId ASC, sessionStart DESC

// Collection: training
// Fields: coachId ASC, sessionStart DESC

// Collection: matches
// Fields: playerId ASC, createdAt DESC

// Collection: matches
// Fields: coachId ASC, createdAt DESC

// Collection: goals
// Fields: playerId ASC, status ASC, createdAt DESC

// Collection: goals
// Fields: coachId ASC, status ASC, createdAt DESC

// Collection: schedule
// Fields: userId ASC, date ASC

// Collection: coach_players
// Fields: coachId ASC, status ASC

// Collection: coach_players
// Fields: playerEmail ASC, status ASC

// Collection: feedback
// Fields: targetId ASC, targetType ASC, createdAt DESC
```

**Deploy indexes with**:

```bash
firebase deploy --only firestore:indexes
```

### Data Validation Rules

**Training Sessions**:

- `date`: Must be valid YYYY-MM-DD format
- `duration`: Positive integer (minutes)
- `intensity`: Integer 1-10
- `type`: Must be one of: "Drills", "Match Play", "Conditioning", "Technique"

**Matches**:

- `date`: Must be valid YYYY-MM-DD format
- `matchType`: Must be "Singles" or "Doubles"
- `result`: Must be "Win", "Loss", or "Draw"
- `opponent`: Non-empty string

**Goals**:

- `priority`: Must be "Low", "Medium", or "High"
- `status`: Must be "Not Started", "In Progress", or "Completed"
- `category`: Must be "Skill", "Fitness", "Competitive", or "Other"
- `targetDate`: Must be valid YYYY-MM-DD format, future date preferred

**Schedule Events**:

- `type`: Must be "Training" or "Match"
- `date`: Must be valid YYYY-MM-DD format

---

## Frontend Architecture

### Module System

**ES6 Modules Structure**:

```javascript
// firebase-config.js (Central configuration)
export { auth, db /* ... Firebase services */ };

// Feature modules import what they need
import { auth, db, getDoc, collection } from '../config/firebase-config.js';
```

**Global Window API** (for HTML integration):

```javascript
// Exposing functions for inline HTML event handlers
window.deleteTrainingSession = async (sessionId) => {
  /* ... */
};
window.openLogTrainingModal = () => {
  /* ... */
};
```

### Modular Design Patterns

#### 1. **Authentication Module Pattern**

```javascript
// auth-utils.js
export async function checkAuthenticationState() {
  // Check if user is logged in
  // Return { authenticated, user, userData }
}

export async function waitForAuthentication(maxAttempts, interval) {
  // Poll for auth state with retry logic
}

export function validateRoleAccess(requiredRole, currentRole, redirectUrl) {
  // Enforce role-based page access
}

export async function initWithAuthGuard(initFunction, options) {
  // Wrapper for page initialization with auth check
}
```

#### 2. **Loading State Pattern**

```javascript
// loading.js
window.showLoadingSpinner(containerId, options);
window.hideLoadingSpinner(containerId);
window.showEmptyState(containerId, options);
window.withLoadingState(containerId, asyncFunction, options);

// Usage example:
await window.withLoadingState(
  'training-container',
  async () => {
    const data = await fetchTrainingSessions();
    renderTrainingSessions(data);
  },
  { emptyMessage: 'No training sessions found' }
);
```

#### 3. **Toast Notification Pattern**

```javascript
// toast.js
window.showSuccess(message, duration);
window.showError(message, duration);
window.showInfo(message, duration);
window.showWarning(message, duration);

// Usage:
window.showSuccess('Training session saved successfully!');
```

#### 4. **Modal System Pattern**

```javascript
// modals.js
function openModal(modalId) {
  // Display modal overlay
}

function closeModal() {
  // Hide all modals
}

async function handleTrainingSubmit(event) {
  // Process form submission
  // Validate data
  // Save to Firestore
  // Update UI
  // Show toast
}
```

#### 5. **Role-Based UI Pattern**

```javascript
// role-manager.js
function applyRoleBasedUI() {
  const role = getCurrentUserRole();
  if (role === 'coach') {
    applyCoachUI();
  } else {
    applyPlayerUI();
  }
}

function applyCoachUI() {
  updateSidebarForCoach();
  updatePageTitleForCoach();
  // ... other coach-specific UI changes
}
```

### Component Communication

**Event-Driven Communication**:

```javascript
// Global auth state change event
window.dispatchEvent(
  new CustomEvent('authStateChanged', {
    detail: { user, userData },
  })
);

// Listeners in various modules
window.addEventListener('authStateChanged', (event) => {
  const { user, userData } = event.detail;
  updateUIForUser(userData);
});
```

**Direct Function Calls**:

```javascript
// After saving a training session
await refreshTrainingsData();
window.initUserGreeting(); // Update header
```

### State Management

**Global State Variables**:

```javascript
// firebase-config.js
window.currentUser = null; // Firebase Auth user object
window.currentUserData = null; // Firestore user document

// Updated by auth listener
onAuthStateChanged(auth, async (user) => {
  window.currentUser = user;
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    window.currentUserData = { id: user.uid, ...userDoc.data() };
  }
});
```

**Local State** (per-page):

```javascript
// training.js
let currentFilters = {
  playerId: null,
  startDate: null,
  endDate: null,
};

let realtimeUnsubscribe = null; // Store listener cleanup function
```

### Error Handling

**Consistent Error Pattern**:

```javascript
async function deleteTrainingSession(sessionId) {
  try {
    await deleteDoc(doc(db, 'training', sessionId));
    await refreshTrainingsData();
    window.showSuccess('Training session deleted successfully');
  } catch (error) {
    console.error('Error deleting training session:', error);
    window.showError('Failed to delete training session. Please try again.');
  }
}
```

**Authentication Errors**:

```javascript
// login.js
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    showError('No account found with this email');
  } else if (error.code === 'auth/wrong-password') {
    showError('Incorrect password');
  } else {
    showError('Login failed. Please try again.');
  }
}
```

---

## Authentication & Security

### Authentication Flow

```
User enters credentials
    ↓
Firebase Authentication validates
    ↓
Auth state changed
    ↓
onAuthStateChanged listener triggered
    ↓
Fetch user document from Firestore
    ↓
Update global state (window.currentUser, window.currentUserData)
    ↓
Dispatch 'authStateChanged' event
    ↓
Update UI based on role
```

### Security Rules Enforcement

**User Data Access**:

```javascript
// firestore.rules
match /users/{userId} {
  // Anyone logged in can see basic user info (for names, etc.)
  allow get, list: if request.auth != null;

  // Only user can read their full profile
  allow read: if request.auth != null && request.auth.uid == userId;

  // Only user can update their own profile
  allow update: if request.auth != null && request.auth.uid == userId;
}
```

**Training Data Access**:

```javascript
match /training/{sessionId} {
  // Can read if you're the player OR the coach
  allow read: if request.auth != null &&
    (resource.data.playerId == request.auth.uid ||
     resource.data.coachId == request.auth.uid);

  // Can create/update if you're setting yourself as player or coach
  allow create, update: if request.auth != null &&
    request.resource.data.keys().hasAll(['playerId','coachId']) &&
    (request.resource.data.playerId == request.auth.uid ||
     request.resource.data.coachId == request.auth.uid);
}
```

**Coach-Player Relationships**:

```javascript
match /coach_players/{relationId} {
  // Coach can create invitation
  allow create: if request.auth != null &&
    request.auth.uid == request.resource.data.coachId;

  // Player can accept (update status from pending to accepted)
  allow update: if request.auth != null &&
    request.auth.token.email == resource.data.playerEmail &&
    resource.data.status == "pending" &&
    request.resource.data.status == "accepted";

  // Coach can delete (remove player from roster)
  allow delete: if request.auth != null &&
    resource.data.coachId == request.auth.uid;
}
```

### Client-Side Security Checks

**Page Access Control**:

```javascript
// auth-utils.js
export function validateRoleAccess(requiredRole, currentRole, redirectUrl) {
  if (!currentRole) {
    window.location.href = redirectUrl || '/login.html';
    return false;
  }

  if (requiredRole && currentRole !== requiredRole) {
    // Redirect to appropriate dashboard
    if (currentRole === 'coach') {
      window.location.href = '/coach-dashboard.html';
    } else {
      window.location.href = '/player-dashboard.html';
    }
    return false;
  }

  return true;
}
```

**Data Query Filtering**:

```javascript
// training.js - Ensure queries respect user role
async function fetchPlayerTrainingSessions(userId) {
  const q = query(
    collection(db, 'training'),
    where('playerId', '==', userId),
    orderBy('sessionStart', 'desc')
  );
  return await getDocs(q);
}

async function fetchCoachTrainingSessions(coachId, playerId) {
  const q = query(
    collection(db, 'training'),
    where('coachId', '==', coachId),
    playerId ? where('playerId', '==', playerId) : null,
    orderBy('sessionStart', 'desc')
  );
  return await getDocs(q);
}
```

### Password Security

**Validation Requirements**:

- Minimum 8 characters
- At least one uppercase letter
- At least one number
- Password strength indicator during registration

```javascript
// login.js
isValidPassword(password) {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[0-9]/.test(password);
}

getStrength(password) {
  if (password.length === 0) return 'none';
  if (password.length < 8) return 'weak';

  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  if (score <= 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}
```

---

## State Management

### Global State

**Authentication State**:

```javascript
// firebase-config.js
window.currentUser = null; // Firebase User object
window.currentUserData = null; // { id, email, firstName, lastName, role, ... }
```

**Usage across modules**:

```javascript
// Any module can access current user
const userId = window.currentUser?.uid;
const userRole = window.currentUserData?.role;
const userName = window.currentUserData?.name;
```

### Local Component State

**Example: Training Page State**:

```javascript
// training.js
let currentFilters = {
  playerId: null,
  startDate: null,
  endDate: null,
};

let realtimeUnsubscribe = null; // Cleanup function for real-time listener
let cachedTrainingData = []; // Store fetched data locally
```

### State Synchronization

**Profile Name Update Flow**:

```javascript
// profile.html inline script
async function handleSaveClick() {
  // 1. Update Firestore
  await updateDoc(userRef, { firstName, lastName, name });

  // 2. Update global state
  window.currentUserData.firstName = firstName;
  window.currentUserData.lastName = lastName;
  window.currentUserData.name = name;

  // 3. Refresh UI components
  window.initUserGreeting(); // Updates header

  // 4. Show feedback
  window.showSuccess('Profile updated successfully!');
}
```

### Real-Time State Updates

**Listening to Firestore Changes**:

```javascript
// training.js
function setupRealtimeListener() {
  const q = query(
    collection(db, 'training'),
    where('playerId', '==', window.currentUser.uid),
    orderBy('sessionStart', 'desc')
  );

  realtimeUnsubscribe = onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    renderTrainingSessions(sessions);
  });
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (realtimeUnsubscribe) {
    realtimeUnsubscribe();
  }
});
```

---

## Real-Time Features

### Real-Time Data Synchronization

**Firestore Real-Time Listeners**:

```javascript
// onSnapshot listener pattern
import { onSnapshot, query, collection, where, orderBy } from './firebase-config.js';

const unsubscribe = onSnapshot(
  query(collection(db, 'training'), where('playerId', '==', userId)),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New training: ', change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Modified training: ', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed training: ', change.doc.data());
      }
    });

    // Re-render entire list
    const allSessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    renderTrainingSessions(allSessions);
  },
  (error) => {
    console.error('Error in real-time listener:', error);
  }
);

// Cleanup
return () => unsubscribe();
```

### Coach Feedback System

**Real-Time Feedback Updates**:

```javascript
// training.js
function setupFeedbackListener(sessionId, container) {
  const feedbackQuery = query(
    collection(db, 'feedback'),
    where('targetId', '==', sessionId),
    where('targetType', '==', 'training'),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<p class="no-feedback">No coach feedback yet</p>';
      return;
    }

    snapshot.forEach((doc) => {
      const feedback = doc.data();
      const feedbackElement = createFeedbackElement(feedback);
      container.appendChild(feedbackElement);
    });
  });

  // Store cleanup function
  container.dataset.unsubscribe = unsubscribe;
}
```

### Invitation Notifications

**Pending Invitation Polling**:

```javascript
// player-dashboard.js
async function checkPendingInvitations() {
  const userEmail = window.currentUser.email;

  const q = query(
    collection(db, 'coach_players'),
    where('playerEmail', '==', userEmail),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const invitations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    displayInvitationNotifications(invitations);
  }
}

// Called on auth state change
window.addEventListener('authStateChanged', () => {
  if (window.currentUserData?.role === 'player') {
    checkPendingInvitations();
  }
});
```

---

## Deployment

### Vercel Deployment Configuration

**vercel.json**:

```json
{
  "version": 2,
  "public": true,
  "buildCommand": "node build.js",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/", "destination": "/index.html" },
    { "source": "/login", "destination": "/login.html" },
    { "source": "/(.*)", "destination": "/$1.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Build Process

**build.js** (Optional optimization):

```javascript
import fs from 'fs';
import path from 'path';

// Copy public/ to dist/
function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  entries.forEach((entry) => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Clean dist/
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}

// Build
copyDirectory('public', 'dist');
console.log('Build complete!');
```

### Environment Configuration

**Firebase Configuration**:

- Production config in `firebase-config.js`
- API keys are public (restricted by Firebase project settings)
- Firestore security rules provide backend protection

**Deployment Steps**:

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Deploy update"
   git push origin main
   ```

2. **Vercel Auto-Deployment**:
   - Vercel detects push to main branch
   - Runs build command
   - Deploys to production
   - URL: https://shuttlestats.vercel.app

3. **Firebase Rules Deployment**:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

---

## Performance Considerations

### Optimization Strategies

#### 1. **Query Optimization**

**Use Composite Indexes**:

```javascript
// Efficient query with index
const q = query(
  collection(db, 'training'),
  where('playerId', '==', userId),
  orderBy('sessionStart', 'desc'),
  limit(20)
);
```

**Pagination for Large Datasets**:

```javascript
// Load more pattern
let lastVisible = null;

async function loadMoreTrainingSessions() {
  let q = query(
    collection(db, 'training'),
    where('playerId', '==', userId),
    orderBy('sessionStart', 'desc'),
    limit(20)
  );

  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }

  const snapshot = await getDocs(q);
  lastVisible = snapshot.docs[snapshot.docs.length - 1];
  return snapshot;
}
```

#### 2. **Caching Strategies**

**Cache User Names**:

```javascript
// Avoid repeated user lookups
const userNameCache = new Map();

async function getPlayerName(playerId) {
  if (userNameCache.has(playerId)) {
    return userNameCache.get(playerId);
  }

  const userDoc = await getDoc(doc(db, 'users', playerId));
  const name = userDoc.data()?.name || 'Unknown Player';
  userNameCache.set(playerId, name);
  return name;
}
```

#### 3. **Loading States**

**Progressive Rendering**:

```javascript
// Show skeleton UI immediately
window.showSkeletonLoading('training-container', 5, 'training-card');

// Fetch and render data
const sessions = await fetchTrainingSessions();
renderTrainingSessions(sessions);

// Hide skeleton
window.hideLoadingSpinner('training-container');
```

#### 4. **Batched Writes**

**Batch Multiple Operations**:

```javascript
import { writeBatch } from './firebase-config.js';

async function batchUpdateGoals(updates) {
  const batch = writeBatch(db);

  updates.forEach(({ goalId, data }) => {
    const ref = doc(db, 'goals', goalId);
    batch.update(ref, data);
  });

  await batch.commit();
}
```

#### 5. **Real-Time Listener Management**

**Cleanup Listeners**:

```javascript
let listeners = [];

function setupAllListeners() {
  listeners.push(onSnapshot(trainingsQuery, handleTrainings));
  listeners.push(onSnapshot(matchesQuery, handleMatches));
}

function cleanupAllListeners() {
  listeners.forEach((unsubscribe) => unsubscribe());
  listeners = [];
}

window.addEventListener('beforeunload', cleanupAllListeners);
```

### Performance Monitoring

**Key Metrics to Track**:

- Initial page load time
- Time to interactive (TTI)
- Firestore read/write counts
- Real-time listener count
- Cache hit rates

**Browser Performance API**:

```javascript
// Measure operation performance
performance.mark('fetch-start');
await fetchTrainingSessions();
performance.mark('fetch-end');
performance.measure('training-fetch', 'fetch-start', 'fetch-end');

const measure = performance.getEntriesByName('training-fetch')[0];
console.log(`Fetch took ${measure.duration}ms`);
```

---

## Development Workflow

### Local Development Setup

1. **Clone Repository**:

   ```bash
   git clone https://github.com/JerbyCalo/ShuttleStats.git
   cd ShuttleStats
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Firebase**:
   - Update `public/config/firebase-config.js` with your project config
   - Deploy security rules: `firebase deploy --only firestore:rules`

4. **Run Local Server**:

   ```bash
   # Using Python
   python -m http.server 8000 --directory public

   # Using Node.js
   npx http-server public -p 8000

   # Using PHP
   php -S localhost:8000 -t public
   ```

5. **Open Browser**:
   ```
   http://localhost:8000
   ```

### Code Quality

**Linting**:

```bash
npm run lint
```

**Formatting**:

```bash
npm run format
npm run format:check
```

**ESLint Configuration** (`eslint.config.js`):

```javascript
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
```

### Git Workflow

**Branch Strategy**:

- `main` - Production branch (auto-deploys to Vercel)
- `develop` - Development branch
- `feature/*` - Feature branches

**Commit Conventions**:

```
feat: Add progress analytics dashboard
fix: Correct training intensity scale
docs: Update user guide with new features
style: Format code with Prettier
refactor: Simplify modal system logic
test: Add security rules tests
chore: Update dependencies
```

### Testing

**Manual Testing Checklist**:

- [ ] Registration flow (player and coach)
- [ ] Login (email/password and Google)
- [ ] CRUD operations (training, matches, goals, events)
- [ ] Coach-player connection flow
- [ ] Feedback system (real-time updates)
- [ ] Profile editing and name synchronization
- [ ] Analytics dashboard (all 5 charts)
- [ ] Role-based UI rendering
- [ ] Mobile responsiveness

**Security Rules Testing**:

```bash
npm run test:rules
```

### Debugging

**Browser DevTools**:

- Console: Check for JavaScript errors
- Network: Monitor Firebase API calls
- Application: Inspect Firebase Auth state and IndexedDB

**Firebase Debugging**:

```javascript
// Enable Firestore debug logging
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db, { synchronizeTabs: true }).catch((err) => {
  console.error('Persistence error:', err);
});
```

**Common Issues**:

- **CORS errors**: Ensure Firebase project allows your domain
- **Permission denied**: Check Firestore security rules
- **Data not loading**: Verify auth state and user roles
- **Real-time updates not working**: Check listener setup and cleanup

---

## Future Enhancements

### Planned Features

1. **Advanced Analytics**:
   - Historical year-over-year comparisons
   - Predictive performance modeling
   - Custom date range filtering

2. **Communication System**:
   - In-app messaging between coach and player
   - Announcement/bulletin board
   - Notification center

3. **Enhanced Profile**:
   - Avatar upload with image storage
   - Profile privacy settings
   - Email/password change functionality

4. **Achievement System**:
   - Milestone badges and trophies
   - Gamification elements
   - Progress streaks and rewards

5. **Data Export**:
   - CSV/PDF export for training logs
   - Performance reports
   - Goal tracking summaries

### Technical Debt

- **Migrate from global `window` API to ES6 modules**: Reduce global namespace pollution
- **Consolidate duplicate auth checks**: Centralize in `auth-utils.js`
- **Implement proper error boundary pattern**: Catch and handle errors gracefully
- **Add unit tests**: Test critical business logic
- **Optimize bundle size**: Code splitting and lazy loading

---

## Appendix

### Useful Commands

```bash
# Development
npm install                    # Install dependencies
npm run lint                   # Lint code
npm run format                 # Format code
npm run format:check           # Check formatting

# Firebase
firebase login                 # Authenticate
firebase deploy --only firestore:rules    # Deploy security rules
firebase deploy --only firestore:indexes  # Deploy indexes

# Git
git add .
git commit -m "message"
git push origin main

# Local server
npx http-server public -p 8000
```

### Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Chart.js Documentation**: https://www.chartjs.org/docs
- **Vercel Documentation**: https://vercel.com/docs
- **MDN Web Docs**: https://developer.mozilla.org

---

**Last Updated**: October 12, 2025  
**Version**: 1.0  
**Maintainer**: ShuttleStats Development Team
