# ShuttleStats Progress Report — Function Inventory (v1.1)

Updated: 2025-10-12
Repository: ShuttleStats

This update revises the Progress Report to include a complete inventory of functions currently in the codebase, grouped by file. It reflects the latest JavaScript modules under `public/js`, shared utilities, and build scripts.

Notes

- Scope: Includes project-authored functions, class methods, and globally exposed window functions. Re-exported Firebase SDK functions are excluded.
- Event listeners (e.g., DOMContentLoaded) and important callbacks are noted where relevant.
- Some pages use immediately-invoked function expressions (IIFEs) to avoid polluting global scope; globally exposed API points are listed explicitly.

## Summary

- Total JS modules scanned: 20+
- Notable patterns:
  - Consistent use of role-aware logic (player/coach) across Training, Matches, Goals, Schedule.
  - Centralized loading and empty-state utilities in `loading.js`.
  - Centralized auth helpers in `auth-utils.js` and global auth state via `firebase-config.js`.
  - Many features expose convenience methods on `window` to integrate with HTML.

---

## Function inventory by file

### public/js/app.js

- window.getCurrentUserRole(): string — Determine user role (coach/player) from URL or pathname.
- DOMContentLoaded handler — Wires sign-out button to redirect to `index.html`.

### public/js/auth-utils.js

- checkAuthenticationState(): Promise<{authenticated, user, userData}>
- waitForAuthentication(maxAttempts=10, interval=500): Promise<AuthState>
- showAuthenticationRequired(containerId, options?)
- validateRoleAccess(requiredRole, currentRole, redirectUrl?): boolean
- initWithAuthGuard(initFunction, options?): Promise<boolean>
- Exports: ES modules + CommonJS + window.authUtils

### public/js/achievement.js

- DOMContentLoaded handler — Coach/player view initialization and content swap.

### public/js/admin-cleanup.js

Class: AdminCleanup

- constructor()
- authenticateAdmin(email, password): Promise<User>
- deleteCurrentUser(): Promise<void>
- deleteUserDocument(userId): Promise<void>
- cleanupAllCollections(): Promise<void>
- deleteCollection(collectionName): Promise<void>
- getAllUsers(): Promise<Array>
- Global: window.AdminCleanup = new AdminCleanup()

### public/js/coach-dashboard.js

- renderTrainingCommitmentKPI(trainingData)
- renderCurrentFocusKPI(goalsData)
- renderRecentTraining(trainingData)
- renderUpcomingMatches(matchesData)
- renderCurrentGoals(goalsData)
- showLoadingState()
- updateDashboardUI(playerId): Promise<void>
- getPlayerData(playerId): Promise<{training, matches, goals}>
- loadPlayerSelector(): Promise<void>
- DOMContentLoaded handler — Initializes and defers to auth state.

### public/js/goals.js

- cleanGoalData(data)
- formatDate(dateString)
- getStatusClass(status)
- getPriorityClass(priority)
- getDaysUntilTarget(targetDate)
- getPlayerName(playerId): Promise<string>
- createGoalCard(goal): Promise<HTMLElement>
- filterGoalsData(playerId): Promise<Array>
- updateGoalsStats(goalsData?)
- renderGoals(goalsData?): Promise<void>
- createPlayerFilterDropdown(): Promise<void> (currently not used for coach mode per comments)
- setupCoachMode()
- setupAddGoalButton()
- refreshGoalsData(): Promise<void>
- deleteGoal(goalId): Promise<void>
- editGoal(goalId): Promise<void>
- populateEditForm(goal)
- showSuccessMessage(message)
- window.loadGoals(): Promise<void>
- checkAuthenticationState(): {authenticated,user,userData} (local fallback)
- waitForAuthentication(maxAttempts, interval): Promise<AuthState>
- initGoalsPage(): Promise<void>
- setupGoalEventDelegation()
- DOMContentLoaded handler — bootstraps page via initGoalsPage.
- Globals exposed: window.filterGoalsData, window.renderGoals, window.refreshGoalsData, window.deleteGoal, window.editGoal.

### public/js/loading.js

- window.showLoadingSpinner(containerId, options?)
- window.hideLoadingSpinner(containerId)
- window.showGlobalLoader(options?)
- window.hideGlobalLoader()
- window.showLocalLoader(containerId, options?)
- window.showSkeletonLoading(containerId, count?, type?)
- createSkeletonItem(type) — internal
- window.simulateNetworkDelay(delay?)
- window.showButtonLoading(buttonElement, loadingText?)
- window.hideButtonLoading(buttonElement)
- window.showEmptyState(containerId, options?)
- window.withLoadingState(containerId, asyncFunction, options?)
- window.LoadingUtils: { showSpinner, hideSpinner, showSkeleton, showEmpty, simulateDelay, withLoading }

### public/js/login.js

ValidationUtils

- isValidEmail(email)
- hasUppercase(str)
- hasNumber(str)
- isValidPassword(password)
- showFieldError(fieldId, message)
- hideFieldError(fieldId)
- clearFieldValidation(fieldId)

PasswordStrength

- getStrength(password): 'none'|'weak'|'fair'|'good'|'strong'
- updateStrengthDisplay(password, prefix='signup-')

FormToggle

- updateFormPrompt(isLoginForm)
- showSignUp()
- showLogin()

SignUpForm

- init()
- bindFieldValidation()
- bindPasswordToggles()
- bindRoleChange()
- bindCoachSelection()
- validateFirstName()
- validateLastName()
- validateEmail()
- validatePassword()
- validateConfirmPassword()
- validateRole()
- validateCoachEmail()
- checkFormValidity(): boolean
- collectFormData(): object
- handleSubmit(e): Promise<void>
- resetForm()

LoginForm

- init()
- setupPasswordToggle()
- handleSubmit(e): Promise<void>
- handleGoogleSignIn(e): Promise<void>

DOMContentLoaded handler — Initializes SignUpForm and LoginForm and toggle link.

### public/js/matches.js

- formatDate(dateString)
- getResultClass(result)
- formatScore(match)
- getPlayerName(playerId): Promise<string>
- getCoachName(coachId): Promise<string>
- submitMatchFeedback(matchId): Promise<boolean>
- loadMatchFeedback(matchId, container): Promise<void>
- setupMatchFeedbackListener(matchId, container)
- createMatchCard(match): Promise<HTMLElement>
- fetchPlayerMatches(userId): Promise<Array>
- fetchCoachMatches(coachId, playerId?): Promise<Array>
- filterMatchesData(playerId): Promise<Array>
- updateMatchStats(data)
- window.loadMatches(): Promise<void>
- renderMatches(matchesData?): Promise<void>
- createPlayerFilterDropdown(): Promise<void>
- setupCoachMode()
- setupEventDelegation()
- setupAddMatchButton()
- window.deleteMatch(matchId): Promise<void>
- window.editMatch(matchId): Promise<void>
- populateEditForm(match)
- showSuccessMessage(message)
- hideAddButtonForCoach()
- DOMContentLoaded handler — initializes based on role and auth state.
- Globals exposed: window.filterMatchesData

### public/js/modals.js

- cleanScheduleData(rawData)
- openModal(modalId)
- closeModal()
- showSuccessMessage(message)
- window.openLogTrainingModal()
- window.openRecordMatchModal()
- window.openSetGoalModal()
- window.openAddEventModal()
- window.closeModal()
- handleTrainingSubmit(event): Promise<void>
- handleMatchSubmit(event): Promise<void>
- handleGoalSubmit(event): Promise<void>
- handleEventSubmit(event): Promise<void>
- DOMContentLoaded handler — binds form submit handlers and modal close actions.

### public/js/my-players.js

- loadPlayersList(): Promise<void>
- createPlayerCard(player): HTMLElement
- updatePlayersStats(total, active)
- handleAddPlayer(playerData): Promise<void>
- handleRemovePlayer(playerId): Promise<void>
- cancelInvitation(relationshipId, playerName): Promise<void>
- getAvatarForUser(userData)
- getRandomAvatar()
- showSuccessMessage(message)
- openAddPlayerModal()
- closeAddPlayerModal()
- openRemovePlayerModal(playerId, playerName)
- closeRemovePlayerModal()
- setupEventListeners()
- DOMContentLoaded handler — initializes list and listeners.
- Globals exposed: window.openAddPlayerModal, window.openRemovePlayerModal, window.cancelInvitation, window.loadPlayersList, window.handleAddPlayer, window.handleRemovePlayer

### public/js/navigation.js

- initializeElements(): boolean
- openSidebar()
- closeSidebar()
- handleMainContentClick(event)
- toggleSidebar()
- handleKeydown(event)
- setupEventListeners()
- DOMContentLoaded handler — sets up nav system.
- Globals exposed: window.navigationSystem { openSidebar, closeSidebar, toggleSidebar, isOpen }

### public/js/player-dashboard.js

- setActiveNav()
- populateHeader({dateString})
- calculateMetrics(currentUserId?): Promise<{trainingSessions,matchesPlayed,improvementRate,goalsAchieved,bestWinStreak}>
- populateMetrics(metrics)
- populateActivities(activities)
- getRecentActivities(currentUserId): Promise<Array<{title,timestamp,date,type}>>
- checkPendingInvitations(): Promise<void>
- displayInvitationNotifications(invitations)
- acceptCoachInvitation(invitationId, coachName): Promise<void>
- declineCoachInvitation(invitationId, coachName): Promise<void>
- setupQuickActions()
- setupNavigation()
- window.loadPlayerDashboard(): Promise<void>
- DOMContentLoaded handler — auto-loads dashboard if present.
- Globals exposed: window.acceptCoachInvitation, window.declineCoachInvitation, window.checkPendingInvitations

### public/js/profile.js

Note: Profile editing is implemented directly in `profile.html` inline script module.

Inline module functions (profile.html <script type="module">):

- toTitleCase(value): string — Converts string to title case
- getInitials(name): string — Extracts initials from full name
- buildPlaceholderAvatar(name): string — Generates placeholder avatar URL with initials
- setLoadingState(isLoading, message?) — Shows/hides profile loading state
- renderProfile(profile) — Renders user profile data to DOM elements
- fetchCoachName(coachId): Promise<string|null> — Retrieves coach name from Firestore
- extractStringValue(value): string — Safely extracts string from various name formats
- buildProfileData(authUser): Promise<ProfileObject> — Constructs complete profile object from auth + Firestore
- toggleEditMode() — Toggles UI between view and edit modes
- handleEditClick() — Handles "Edit Profile" button click, populates form fields
- handleCancelClick() — Handles "Cancel" button click, discards changes
- handleSaveClick(): Promise<void> — Core save logic: validates, updates Firestore, syncs global state, shows notifications
- DOMContentLoaded handler — Initializes profile display, attaches event listeners

Key Features:

- In-place profile name editing (first/last name)
- Firestore integration with `updateDoc`
- Global state synchronization (window.currentUserData.name)
- Header greeting refresh via window.initUserGreeting()
- Toast notifications for success/error feedback
- Input validation and loading states
- Coach information display for players

Globals exposed: window.logout (async function for settings dropdown)

### public/js/progress.js

Data Fetching Functions:

- fetchTrainingSessions(userId): Promise<Array> — Retrieves training sessions from Firestore for a specific user
- fetchMatches(userId): Promise<Array> — Retrieves match records from Firestore for a specific user
- fetchGoals(userId): Promise<Array> — Retrieves active goals from Firestore for a specific user

Data Processing Functions:

- processPerformanceData(trainingSessions, matches): Object — Aggregates performance metrics over the last 6 months
- processIntensityData(trainingSessions): Object — Calculates intensity distribution with 4-tier classification (Light, Moderate, Intense, Extreme)
- processMatchResults(matches): Object — Calculates win/loss/draw statistics from match records
- processWeeklyActivity(trainingSessions, matches): Object — Aggregates training and match activity by week
- processGoalsProgress(goals): Object — Processes goal completion percentages and categorizes by status
- calculateInsights(trainingSessions, matches): Object — Generates performance insights including trends and streaks
- updateStatsCards(trainingSessions, matches) — Updates dashboard statistics cards with real-time data

Chart Initialization Functions:

- initPerformanceChart(performanceData, insights) — Creates line chart showing performance trends over time with training sessions and match results
- updateInsights(insights) — Updates insight cards with calculated performance metrics
- initIntensityChart(intensityData) — Creates doughnut chart displaying training intensity distribution across 4 tiers
- initMatchResultsChart(matchResultsData) — Creates pie chart showing win/loss/draw percentages
- initWeeklyActivityChart(weeklyActivityData) — Creates vertical bar chart displaying weekly training and match activity
- initGoalsProgressChart(goalsProgressData) — Creates horizontal bar chart showing progress toward active goals

Utility Functions:

- createGradient(ctx, color1, color2): Gradient — Helper function for creating canvas gradients

Main Functions:

- loadProgressData(): Promise<void> — Main data loader that fetches all data, processes it, and initializes all 5 charts
- DOMContentLoaded handler — Initializes progress page, handles authentication, and loads analytics dashboard

Note: Progress page features 5 Chart.js visualizations (Performance Trends, Training Intensity Distribution, Match Results, Weekly Activity, Goals Progress) integrated with real-time Firestore data. Removed placeholder skill assessment chart in favor of implemented analytics (Oct 12, 2025).

### public/js/role-manager.js

- navigateToDashboard()
- applyRoleBasedUI()
- applyCoachUI()
- applyPlayerUI()
- updateSidebarForCoach()
- updateSidebarForPlayer()
- updatePageTitleForCoach()
- updateUserProfileDisplay(roleName)
- updatePersonalizedUserGreeting(userData)
- initializeUserGreeting()
- setupSignOutHandler()
- handleCoachModeURLs(): boolean
- initialize() — main init with error handling
- Immediately invoked with try/catch; sets up role-based UI and greeting.
- Globals exposed: window.RoleManager { getCurrentRole, refreshUI, setRole }

### public/js/schedule.js

- cleanScheduleData(data)
- formatDate(dateString)
- formatTime(timeString)
- getEventTypeClass(type)
- getPlayerName(playerId): Promise<string>
- getParticipantDisplay(userId): Promise<string>
- filterScheduleData(playerId): Promise<Array>
- groupEventsByDate(eventsData?)
- getLocalDateKey(date)
- normalizeScheduleEvents(events)
- formatMonthYear(date)
- getCalendarDays(year, month)
- renderCalendar()
- showDayEvents(date, events)
- openDayEventsModal()
- closeDayEventsModal()
- switchView(view)
- initializeViewState()
- navigateMonth(direction)
- createEventCard(event): HTMLElement
- updateScheduleStats() — early definition
- renderScheduleEvents(eventsData?): Promise<void>
- updateScheduleStats(eventsData?) — later definition (overrides earlier)
- createPlayerFilterDropdown(): Promise<void>
- setupCoachMode()
- setupAddEventButton()
- setupViewToggle()
- setupCalendarNavigation()
- setupDayEventsModal()
- deleteEvent(eventId): Promise<void>
- editEvent(eventId): Promise<void>
- populateEditForm(event)
- showSuccessMessage(message)
- setupScheduleEventDelegation()
- DOMContentLoaded handler — initializes view and listeners based on role/auth.
- Globals exposed: window.renderScheduleEvents, window.renderCalendar, window.filterScheduleData

### public/js/settings-dropdown.js

- initializeElements(): boolean
- openDropdown()
- closeDropdown()
- toggleDropdown(event)
- handleClickOutside(event)
- handleSettingsIconClick(event)
- setupEventListeners()
- handleLogout(): Promise<void>
- DOMContentLoaded handler — initializes dropdown behavior.
- Globals exposed: window.settingsDropdown { open, close, toggle, isOpen }

### public/js/toast.js

- initializeStyles()
- ensureToastContainer()
- getToastIcon(type)
- showToast(message, type='info', duration=4000)
- dismissToast(toast)
- dismissAllToasts()
- showSuccess(message, duration?)
- showError(message, duration?)
- showInfo(message, duration?)
- showWarning(message, duration?)
- Globals exposed: window.showToast, window.showSuccess, window.showError, window.showInfo, window.showWarning, window.dismissAllToasts, window.Toast

### public/js/training.js

- formatDate(dateString)
- getIntensityClass(intensity) — Maps 1-10 intensity to CSS class (light/moderate/intense/extreme)
- getIntensityLabel(intensity) — Converts numeric intensity to descriptive label
- getPlayerName(playerId): Promise<string>
- getCoachName(coachId): Promise<string>
- submitFeedback(sessionId): Promise<boolean>
- loadFeedback(sessionId, container): Promise<void>
- setupFeedbackListener(sessionId, container)
- createTrainingCard(session): Promise<HTMLElement>
- fetchPlayerTrainingSessions(userId): Promise<Array>
- fetchCoachTrainingSessions(coachId, playerId?): Promise<Array>
- filterTrainingData(playerId): Promise<Array>
- updateTrainingStats(data)
- renderTrainingSessions(sessionsData?): Promise<void>
- createPlayerFilterDropdown(): Promise<void>
- setupCoachMode()
- setupEventDelegation()
- setupAddTrainingButton()
- window.deleteTrainingSession(sessionId): Promise<void>
- window.editTrainingSession(sessionId): Promise<void>
- populateEditForm(session)
- showSuccessMessage(message)
- window.loadTrainingSessions(): Promise<void>
- setupRealtimeListener()
- cleanupRealtimeListener()
- initializePage(): Promise<void>
- hideAddButtonForCoach()
- DOMContentLoaded handler — bootstraps page or redirects when unauthenticated.
- Globals exposed: window.filterTrainingData

Note: Training intensity updated to 1-10 numeric scale with 4-tier classification system (1-3: Light, 4-6: Moderate, 7-8: Intense, 9-10: Extreme) matching progress analytics (Oct 12, 2025).

### public/js/user-greeting.js

- updateUserGreeting(userData)
- initUserGreeting()
- DOMContentLoaded handler — initializes greeting system.
- Globals exposed: window.updateUserGreeting, window.initUserGreeting

### public/config/firebase-config.js

- onAuthStateChanged(auth, async (user) => { ... }) — Listener callback updates:
  - window.currentUser
  - window.currentUserData (FireStore fetch)
  - Dispatches `window.dispatchEvent(new CustomEvent('authStateChanged', { detail }))`
- Exports Firebase services and Firestore helpers (SDK functions).

### build.js (Node script)

- copyDirectory(src, dest) — Recursive copy for build output
- Top-level build routine cleans and copies `public/` to `dist/`.

### eslint.config.js

- No project-defined functions; exports ESLint config arrays/objects.

---

## Global window API summary

- Authentication: window.authUtils.{checkAuthenticationState, waitForAuthentication, ...}
- Loading/UX: window.{showLoadingSpinner, hideLoadingSpinner, showEmptyState, simulateNetworkDelay, LoadingUtils}
- Toasts: window.{showToast, showSuccess, showError, showInfo, showWarning, dismissAllToasts, Toast}
- Pages: window.{loadTrainingSessions, loadMatches, loadGoals, renderScheduleEvents, renderCalendar}
- Actions: window.{openLogTrainingModal, openRecordMatchModal, openSetGoalModal, openAddEventModal, closeModal}
- Dashboards/Utilities: window.{navigationSystem, settingsDropdown, updateUserGreeting, initUserGreeting, RoleManager}
- Admin: window.AdminCleanup

---

## Notes and observations

- Schedule: `updateScheduleStats` is defined twice; later definition supersedes earlier.
- Some modules define local fallbacks for auth checks that duplicate `auth-utils.js` behavior; consider consolidating.
- Many features expose functions on `window` for HTML integration; migrating to module-based imports across pages would reduce globals.
- **Profile editing:** Implemented as inline module in `profile.html` with full CRUD operations, validation, and state synchronization (updated Oct 12, 2025).

---

End of report.
