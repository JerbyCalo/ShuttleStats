# ShuttleStats v2 - Project Roadmap

## Overview

ShuttleStats is a web application for tracking badminton player performance. This document outlines the phased development plan for version 2, moving from a front-end prototype with mock data to a full-stack application with Firebase integration.

---

## Phase 1: Login & Core Navigation (Complete)

**Goal:** Establish the basic application flow and user authentication structure.

- [x] Implement login page with hardcoded credentials.
- [x] Basic routing to placeholder dashboard pages based on user role (Player/Coach).

## Phase 2: Player Experience & Structure (Complete)

**Goal:** Build the foundational structure and polish the core player-facing experience.

### Phase 2.1: Polish Player Dashboard (Complete)

- [x] Refactor `player-dashboard.html` for visual cohesion and functionality.
- [x] Display dynamic mock data summaries.

### Phase 2.2: Build Navigation Page Skeletons (Complete)

- [x] Create basic HTML shells for all main pages:
  - `training.html`
  - `matches.html`
  - `schedule.html`
  - `progress.html`
  - `achievement.html`
  - `goal.html`

## Phase 3: Interactive Components (Complete)

**Goal:** Add interactivity to create a dynamic user experience.

- [x] Build a reusable modal system (`modal.js`).
- [x] Implement "Add New", "Edit", and "Delete" actions using modals across all pages.

## Phase 4: Populate Page Functionality (Complete)

**Goal:** Flesh out each page with full CRUD (Create, Read, Update, Delete) operations using mock data.

### Phase 4.1: Training Page (Complete)

- [x] Build `training.html` and connect to `training.js`.
- [x] Display list of training sessions from `mockTrainingData`.
- [x] Add functionality to create, edit, and delete training sessions via modals.

### Phase 4.2: Matches Page (Complete)

- [x] Build `matches.html` and connect to `matches.js`.
- [x] Display list of matches from `mockMatchesData`.
- [x] Add functionality to create, edit, and delete matches via modals.

### Phase 4.3: Goals Page (Complete)

- [x] Build `goal.html` and connect to `goals.js`.
- [x] Display list of goals from `mockGoalsData`.
- [x] Add functionality to create, edit, and delete goals via modals.

### Phase 4.4: Schedule Page (Complete)

- [x] Build `schedule.html` and connect to `schedule.js`.
- [x] Display a list view of scheduled items (training + matches).

### Phase 4.4a: Enhanced Schedule View (Complete)

- [x] Integrate a calendar view on the schedule page for better visualization.

## Phase 5: Coach Dashboard & Management (Complete)

**Goal:** Create the coach portal for managing and viewing all player data.

### 5.1 - 5.5: Coach Dashboard & Data Overview (Complete)

- [x] Create `coach-dashboard.html`.
- [x] Create `coach-dashboard.js`.
- [x] Create `mockPlayerListData` for dropdown selection.
- [x] Build a UI featuring a player selector dropdown.
- [x] Upon player selection, display that specific player's data (Training, Matches, Goals, Schedule) in a summarized dashboard view.

### 5.6: Fix Coach Navigation & Role-Based Routing (Complete)

- [x] Coach sidebar navigation must be different from the player's (e.g., "Player Management", "Analytics" sections).
- [x] Logo navigation fixed to direct to the correct dashboard based on user role.

### 5.7: Build the "My Players" Management Page (Complete)

- [x] The page displays a list of all players in `mockPlayerListData`.
- [x] The coach can successfully add a new player via the modal, and the list updates.
- [x] The coach can remove a player (with confirmation) and the list updates.
- [x] The UI is consistent with the rest of the application.

### 5.8: Implement Coach Views on All Pages (Complete)

- [x] A coach can navigate to `training.html?user=coach` and see a modified "Manage Training" page.
- [x] The page has a player filter dropdown. Selecting a player refreshes the list to show only their data.
- [x] This same pattern is successfully implemented for Matches, Goals, and Schedule pages.
- [x] The player experience remains completely unchanged.
- [x] **Update:** The "All Players" filter option was removed to enforce strict data isolation. The dropdown now defaults to the first player in the coach's roster.

## Phase 6: Final Polish & Preparation for Backend (Complete)

**Goal:** Enhance UX and create a clear plan for backend integration.

- [x] Add loading states for all data-fetching operations. (Implemented on Dashboards, Training, Matches, Goals, Schedule, My Players)
- [x] Add empty states for pages with no data. (Implemented alongside loading states)
- [x] Implement success/error toast messages for user actions. (`toast.js` module implemented)
- [x] **CRITICAL:** Create an `API_CHECKLIST.md` document. (Complete and comprehensive)

---

## Feature: User Registration

**Goal:** Implement a comprehensive sign-up form on the login page to allow new users (both players and coaches) to create an account, collecting all necessary information for the future database schema.

**Status:** ✅ Complete

---

## Phase 7: Firebase Integration (Complete)

**Goal:** Replace all mock data with a real Firebase backend.
_This phase follows the implementation priorities outlined in the `API_CHECKLIST.md`._

### ✅ API_CHECKLIST - Phase 1: User Authentication (Complete)

- [x] Implement user authentication with Firebase Auth. (7.1)
- [x] Replace mock login/signup logic.

### ✅ API_CHECKLIST - Phase 2: Core CRUD Operations (Complete)

- [x] Implement Firestore for Training Sessions. (7.2)
- [x] Implement Firestore for Matches. (7.3)
- [x] Implement Firestore for Goals. (7.4)
- [x] Implement Firestore for Schedule. (7.5)
- [x] Work through the `API_CHECKLIST.md`, replacing each mock function.

### ✅ API_CHECKLIST - Phase 3: Coach-Player Relationships (Complete)

- [x] Implement Firestore for Coach-Player management. (7.6 - Add/Remove)
- [x] Implement player invitation acceptance flow.
- [x] Update player documents with `coachId` upon acceptance.
- [x] Coach views filter data strictly by their roster; the "All Players" option was removed to ensure data isolation.

### ✅ API_CHECKLIST - Phase 4: Dashboard Data Aggregation (Complete)

- [x] Update Player Dashboard with real aggregated data.
- [x] Update Coach Dashboard with real aggregated data.

### ✅ API_CHECKLIST - Phase 5: Real-time Features (Complete)

- [x] Implement real-time listeners for live updates.

### ◻️ API_CHECKLIST - Phase 6: Security Rules (Pending)

- [ ] Harden and test all Firestore Security Rules. (7.8)

### ✅ Phase 7.7: Comprehensive Testing & Refinement (Complete)

- [x] Test all user roles (player/coach) and data flows end-to-end.
- [x] Verify data isolation and security. (Core data isolation verified and enforced via UI logic)
- [x] Test all CRUD operations across all data types.
- [x] Identify and fix any remaining bugs.

### Phase 7.9: Final Deployment Preparation (Pending)

- [ ] Optimize application performance.
- [ ] Ensure error handling is robust.
- [ ] Prepare for Firebase Hosting deployment.

---

## Phase 8: Deployment & Launch (Future)

**Goal:** Launch the application to production.

- [ ] Deploy to Firebase Hosting.
- [ ] Configure production environment variables.
- [ ] Perform final production testing.
- [ ] Monitor application performance and errors.