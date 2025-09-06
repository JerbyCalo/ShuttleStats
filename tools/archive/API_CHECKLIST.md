# ShuttleStats v2 - Firebase API Integration Checklist

This document serves as a translation guide between the current front-end mock data operations and future Firebase Firestore API calls. Each operation includes the current implementation, planned Firebase equivalent, and data structure.

---

## 1. User Authentication

### 1.1 User Registration (Sign Up)

**Action:** Create new user account with role-based data  
**Current Mock Implementation:**

```javascript
// From login.js - SignUpForm.handleSubmit()
const userData = {
  name: { first: "John", middle: null, last: "Doe" },
  email: "john.doe@email.com",
  password: "hashed_password",
  role: "player", // or "coach"
  coachEmail: "coach@email.com", // optional
  status: "pending",
};
console.log("User Data:", userData);
```

**Firebase Equivalent:**

```javascript
// Firebase Auth + Firestore
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const userCredential = await createUserWithEmailAndPassword(
  auth,
  email,
  password
);
const userId = userCredential.user.uid;

await setDoc(doc(db, "users", userId), {
  name: { first: "John", middle: null, last: "Doe" },
  email: "john.doe@email.com",
  role: "player",
  coachEmail: "coach@email.com",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

**Data Structure (Firestore Document):**

```javascript
{
  id: "auto_generated_uid", // Firebase Auth UID
  name: {
    first: "string",
    middle: "string | null",
    last: "string"
  },
  email: "string",
  role: "player" | "coach",
  coachEmail: "string | null", // Only for players
  status: "active" | "pending" | "inactive",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 1.2 User Login

**Action:** Authenticate existing user and retrieve user data  
**Current Mock Implementation:**

```javascript
// From login.js - simulated login validation
const isValidLogin = validateCredentials(email, password);
// Redirects to appropriate dashboard
```

**Firebase Equivalent:**

```javascript
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const userCredential = await signInWithEmailAndPassword(auth, email, password);
const userId = userCredential.user.uid;
const userDoc = await getDoc(doc(db, "users", userId));
const userData = userDoc.data();
```

---

## 2. Training Sessions

### 2.1 Create Training Session

**Action:** Log a new training session  
**Current Mock Implementation:**

```javascript
// From modals.js - handleTrainingSubmit()
const newSession = {
  id: Date.now(),
  date: "2025-09-03",
  duration: 90,
  type: "Footwork & Agility",
  intensity: "High",
  location: "Court 1",
  coachComments: "Great session",
  exercises: [],
};
window.mockTrainingData.unshift(newSession);
```

**Firebase Equivalent:**

```javascript
import { collection, addDoc } from "firebase/firestore";

await addDoc(collection(db, "training"), {
  playerId: currentUserId,
  date: "2025-09-03",
  duration: 90,
  type: "Footwork & Agility",
  intensity: "High",
  location: "Court 1",
  coachComments: "Great session",
  exercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 2.2 Read Training Sessions (Player View)

**Action:** Get all training sessions for current player  
**Current Mock Implementation:**

```javascript
// From training.js - player mode
const playerSessions = window.mockTrainingData.filter(
  (session) => session.playerId === currentPlayerId
);
```

**Firebase Equivalent:**

```javascript
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

const q = query(
  collection(db, "training"),
  where("playerId", "==", currentUserId),
  orderBy("date", "desc")
);
const querySnapshot = await getDocs(q);
const sessions = querySnapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));
```

### 2.3 Read Training Sessions (Coach View)

**Action:** Get training sessions for all players or filtered by player  
**Current Mock Implementation:**

```javascript
// From training.js - filterTrainingData()
function filterTrainingData(playerId) {
  if (playerId === "all") {
    return [...window.mockTrainingData];
  }
  return window.mockTrainingData.filter(
    (session) => session.playerId === playerId
  );
}
```

**Firebase Equivalent:**

```javascript
// All sessions for coach
const q = query(
  collection(db, "training"),
  where("coachId", "==", currentUserId),
  orderBy("date", "desc")
);

// Filtered by specific player
const q = query(
  collection(db, "training"),
  where("coachId", "==", currentUserId),
  where("playerId", "==", selectedPlayerId),
  orderBy("date", "desc")
);
```

### 2.4 Update Training Session

**Action:** Edit an existing training session  
**Current Mock Implementation:**

```javascript
// From modals.js - edit mode in handleTrainingSubmit()
const sessionIndex = window.mockTrainingData.findIndex(
  (session) => session.id === window.editingSessionId
);
window.mockTrainingData[sessionIndex] = {
  ...existingSession,
  ...updatedData,
};
```

**Firebase Equivalent:**

```javascript
import { doc, updateDoc } from "firebase/firestore";

await updateDoc(doc(db, "training", sessionId), {
  date: "2025-09-04",
  duration: 95,
  type: "Technical Skills",
  intensity: "Medium",
  updatedAt: new Date(),
});
```

### 2.5 Delete Training Session

**Action:** Remove a training session  
**Current Mock Implementation:**

```javascript
// From training.js - deleteTrainingSession()
const sessionIndex = window.mockTrainingData.findIndex(
  (session) => session.id === sessionId
);
window.mockTrainingData.splice(sessionIndex, 1);
```

**Firebase Equivalent:**

```javascript
import { doc, deleteDoc } from "firebase/firestore";

await deleteDoc(doc(db, "training", sessionId));
```

**Data Structure (Firestore Document):**

```javascript
{
  id: "auto_generated_id",
  playerId: "string", // Reference to user ID
  coachId: "string", // Reference to coach user ID
  date: "YYYY-MM-DD",
  duration: "number", // minutes
  type: "string",
  intensity: "Low" | "Medium" | "High",
  location: "string",
  coachComments: "string",
  exercises: ["string"], // array of exercise names
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

---

## 3. Matches

### 3.1 Create Match

**Action:** Record a new match result  
**Current Mock Implementation:**

```javascript
// From modals.js - handleMatchSubmit()
const newMatch = {
  id: Date.now(),
  date: "2025-09-02",
  opponent: "Alex Chen",
  matchType: "Singles",
  result: "Win",
  yourScore: 21,
  opponentScore: 18,
  yourScore2: 21,
  opponentScore2: 16,
  duration: 45,
  notes: "Great match!",
};
window.mockMatchesData.unshift(newMatch);
```

**Firebase Equivalent:**

```javascript
await addDoc(collection(db, "matches"), {
  playerId: currentUserId,
  date: "2025-09-02",
  opponent: "Alex Chen",
  matchType: "Singles",
  result: "Win",
  yourScore: 21,
  opponentScore: 18,
  yourScore2: 21,
  opponentScore2: 16,
  duration: 45,
  notes: "Great match!",
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 3.2 Read Matches (Player View)

**Action:** Get all matches for current player  
**Current Mock Implementation:**

```javascript
// From matches.js - player mode
const playerMatches = window.mockMatchesData.filter(
  (match) => match.playerId === currentPlayerId
);
```

**Firebase Equivalent:**

```javascript
const q = query(
  collection(db, "matches"),
  where("playerId", "==", currentUserId),
  orderBy("date", "desc")
);
const querySnapshot = await getDocs(q);
```

### 3.3 Read Matches (Coach View)

**Action:** Get matches for all players or filtered by player  
**Current Mock Implementation:**

```javascript
// From matches.js - filterMatchesData()
function filterMatchesData(playerId) {
  if (playerId === "all") {
    return [...window.mockMatchesData];
  }
  return window.mockMatchesData.filter((match) => match.playerId === playerId);
}
```

**Firebase Equivalent:**

```javascript
// All matches for coach's players
const q = query(
  collection(db, "matches"),
  where("coachId", "==", currentUserId),
  orderBy("date", "desc")
);

// Filtered by specific player
const q = query(
  collection(db, "matches"),
  where("playerId", "==", selectedPlayerId),
  where("coachId", "==", currentUserId),
  orderBy("date", "desc")
);
```

### 3.4 Update Match

**Action:** Edit an existing match record  
**Current Mock Implementation:**

```javascript
// From modals.js - edit mode in handleMatchSubmit()
const matchIndex = window.mockMatchesData.findIndex(
  (match) => match.id === window.editingMatchId
);
window.mockMatchesData[matchIndex] = {
  ...existingMatch,
  ...updatedData,
};
```

**Firebase Equivalent:**

```javascript
await updateDoc(doc(db, "matches", matchId), {
  opponent: "Updated Opponent",
  result: "Loss",
  yourScore: 19,
  opponentScore: 21,
  notes: "Updated notes",
  updatedAt: new Date(),
});
```

### 3.5 Delete Match

**Action:** Remove a match record  
**Current Mock Implementation:**

```javascript
// From matches.js - deleteMatch()
const matchIndex = window.mockMatchesData.findIndex(
  (match) => match.id === matchId
);
window.mockMatchesData.splice(matchIndex, 1);
```

**Firebase Equivalent:**

```javascript
await deleteDoc(doc(db, "matches", matchId));
```

**Data Structure (Firestore Document):**

```javascript
{
  id: "auto_generated_id",
  playerId: "string",
  coachId: "string",
  date: "YYYY-MM-DD",
  opponent: "string",
  matchType: "Singles" | "Doubles",
  result: "Win" | "Loss",
  yourScore: "number",
  opponentScore: "number",
  yourScore2: "number | undefined", // Second set
  opponentScore2: "number | undefined",
  yourScore3: "number | undefined", // Third set
  opponentScore3: "number | undefined",
  duration: "number", // minutes
  notes: "string",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

---

## 4. Goals

### 4.1 Create Goal

**Action:** Set a new goal  
**Current Mock Implementation:**

```javascript
// From modals.js - handleGoalSubmit()
const newGoal = {
  id: Date.now(),
  title: "Improve Backhand Clear",
  description: "Achieve 8/10 successful clears",
  category: "Technical",
  priority: "High",
  status: "In Progress",
  targetDate: "2025-10-15",
  progress: 0,
  notes: "Focus on technique",
};
window.mockGoalsData.unshift(newGoal);
```

**Firebase Equivalent:**

```javascript
await addDoc(collection(db, "goals"), {
  playerId: currentUserId,
  title: "Improve Backhand Clear",
  description: "Achieve 8/10 successful clears",
  category: "Technical",
  priority: "High",
  status: "In Progress",
  targetDate: "2025-10-15",
  progress: 0,
  notes: "Focus on technique",
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 4.2 Read Goals (Player View)

**Action:** Get all goals for current player  
**Current Mock Implementation:**

```javascript
// From goals.js - player mode
const playerGoals = window.mockGoalsData.filter(
  (goal) => goal.playerId === currentPlayerId
);
```

**Firebase Equivalent:**

```javascript
const q = query(
  collection(db, "goals"),
  where("playerId", "==", currentUserId),
  orderBy("targetDate", "asc")
);
```

### 4.3 Read Goals (Coach View)

**Action:** Get goals for all players or filtered by player  
**Current Mock Implementation:**

```javascript
// From goals.js - filterGoalsData()
function filterGoalsData(playerId) {
  if (playerId === "all") {
    return [...window.mockGoalsData];
  }
  return window.mockGoalsData.filter((goal) => goal.playerId === playerId);
}
```

**Firebase Equivalent:**

```javascript
// All goals for coach's players
const q = query(
  collection(db, "goals"),
  where("coachId", "==", currentUserId),
  orderBy("targetDate", "asc")
);

// Filtered by specific player
const q = query(
  collection(db, "goals"),
  where("playerId", "==", selectedPlayerId),
  orderBy("targetDate", "asc")
);
```

### 4.4 Update Goal

**Action:** Edit an existing goal  
**Current Mock Implementation:**

```javascript
// From modals.js - edit mode in handleGoalSubmit()
const goalIndex = window.mockGoalsData.findIndex(
  (goal) => goal.id === window.editingGoalId
);
window.mockGoalsData[goalIndex] = {
  ...existingGoal,
  ...updatedData,
};
```

**Firebase Equivalent:**

```javascript
await updateDoc(doc(db, "goals", goalId), {
  title: "Updated Title",
  progress: 75,
  status: "In Progress",
  notes: "Updated notes",
  updatedAt: new Date(),
});
```

### 4.5 Delete Goal

**Action:** Remove a goal  
**Current Mock Implementation:**

```javascript
// From goals.js - deleteGoal()
const goalIndex = window.mockGoalsData.findIndex((goal) => goal.id === goalId);
window.mockGoalsData.splice(goalIndex, 1);
```

**Firebase Equivalent:**

```javascript
await deleteDoc(doc(db, "goals", goalId));
```

**Data Structure (Firestore Document):**

```javascript
{
  id: "auto_generated_id",
  playerId: "string",
  coachId: "string",
  title: "string",
  description: "string",
  category: "Technical" | "Physical" | "Mental" | "Strategy" | "Competition",
  priority: "Low" | "Medium" | "High",
  status: "Not Started" | "In Progress" | "Completed" | "Paused",
  targetDate: "YYYY-MM-DD",
  progress: "number", // 0-100
  notes: "string",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

---

## 5. Schedule Events

### 5.1 Create Schedule Event

**Action:** Add a new event to the schedule  
**Current Mock Implementation:**

```javascript
// From modals.js - handleEventSubmit()
const newEvent = {
  id: Date.now(),
  title: "Training Session",
  date: "2025-09-05",
  time: "18:00",
  type: "Training",
  location: "Court 1",
  notes: "Focus on footwork",
};
window.mockScheduleData.unshift(newEvent);
```

**Firebase Equivalent:**

```javascript
await addDoc(collection(db, "schedule"), {
  title: "Training Session",
  date: "2025-09-05",
  time: "18:00",
  type: "Training",
  location: "Court 1",
  notes: "Focus on footwork",
  participants: [currentUserId], // Array of participant IDs
  createdBy: currentUserId,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 5.2 Read Schedule Events (Player View)

**Action:** Get all events where current player is a participant  
**Current Mock Implementation:**

```javascript
// From schedule.js - player mode
const playerEvents = window.mockScheduleData.filter(
  (event) => event.participants && event.participants.includes(currentPlayerId)
);
```

**Firebase Equivalent:**

```javascript
const q = query(
  collection(db, "schedule"),
  where("participants", "array-contains", currentUserId),
  orderBy("date", "asc")
);
```

### 5.3 Read Schedule Events (Coach View)

**Action:** Get events for all players or filtered by player  
**Current Mock Implementation:**

```javascript
// From schedule.js - filterScheduleData()
function filterScheduleData(playerId) {
  if (playerId === "all") {
    return [...window.mockScheduleData];
  }
  return window.mockScheduleData.filter(
    (event) => event.participants && event.participants.includes(playerId)
  );
}
```

**Firebase Equivalent:**

```javascript
// All events created by coach
const q = query(
  collection(db, "schedule"),
  where("createdBy", "==", currentUserId),
  orderBy("date", "asc")
);

// Events for specific player
const q = query(
  collection(db, "schedule"),
  where("participants", "array-contains", selectedPlayerId),
  where("createdBy", "==", currentUserId),
  orderBy("date", "asc")
);
```

### 5.4 Update Schedule Event

**Action:** Edit an existing schedule event  
**Current Mock Implementation:**

```javascript
// From modals.js - edit mode in handleEventSubmit()
const eventIndex = window.mockScheduleData.findIndex(
  (event) => event.id === window.editingEventId
);
window.mockScheduleData[eventIndex] = {
  ...existingEvent,
  ...updatedData,
};
```

**Firebase Equivalent:**

```javascript
await updateDoc(doc(db, "schedule", eventId), {
  title: "Updated Event",
  date: "2025-09-06",
  time: "19:00",
  location: "Court 2",
  notes: "Updated notes",
  updatedAt: new Date(),
});
```

### 5.5 Delete Schedule Event

**Action:** Remove a schedule event  
**Current Mock Implementation:**

```javascript
// From schedule.js - deleteEvent()
const eventIndex = window.mockScheduleData.findIndex(
  (event) => event.id === eventId
);
window.mockScheduleData.splice(eventIndex, 1);
```

**Firebase Equivalent:**

```javascript
await deleteDoc(doc(db, "schedule", eventId));
```

**Data Structure (Firestore Document):**

```javascript
{
  id: "auto_generated_id",
  title: "string",
  date: "YYYY-MM-DD",
  time: "HH:MM",
  type: "Training" | "Match" | "Tournament" | "Other",
  location: "string",
  notes: "string",
  participants: ["string"], // Array of user IDs
  createdBy: "string", // User ID who created the event
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

---

## 6. Players (Coach Management)

### 6.1 Add Player to Coach's List

**Action:** Coach adds a new player to their managed players  
**Current Mock Implementation:**

```javascript
// From my-players.js - handleAddPlayer()
const newPlayer = {
  id: "player" + (Date.now() + Math.random()).toString(36),
  name: "John Doe",
  email: "john@email.com",
  avatar: "👨‍💼",
  team: "General",
  status: "Active",
};
window.mockPlayerListData.push(newPlayer);
```

**Firebase Equivalent:**

```javascript
// Create coach-player relationship
await addDoc(collection(db, "coach_players"), {
  coachId: currentUserId,
  playerEmail: "john@email.com",
  playerName: "John Doe",
  status: "pending", // Player must accept invitation
  invitedAt: new Date(),
  acceptedAt: null,
});

// Also update the user's coachId when they accept
await updateDoc(doc(db, "users", playerId), {
  coachId: currentUserId,
  updatedAt: new Date(),
});
```

### 6.2 Read Coach's Players

**Action:** Get all players managed by current coach  
**Current Mock Implementation:**

```javascript
// From my-players.js - loadPlayersList()
const coachPlayers = [...window.mockPlayerListData];
```

**Firebase Equivalent:**

```javascript
// Get coach-player relationships
const q = query(
  collection(db, "coach_players"),
  where("coachId", "==", currentUserId),
  where("status", "==", "accepted")
);

// Then get full user details for each player
const relationships = await getDocs(q);
const playerIds = relationships.docs.map((doc) => doc.data().playerId);

const playersData = [];
for (const playerId of playerIds) {
  const playerDoc = await getDoc(doc(db, "users", playerId));
  if (playerDoc.exists()) {
    playersData.push({ id: playerDoc.id, ...playerDoc.data() });
  }
}
```

### 6.3 Remove Player from Coach's List

**Action:** Coach removes a player from their management list  
**Current Mock Implementation:**

```javascript
// From my-players.js - handleRemovePlayer()
const playerIndex = window.mockPlayerListData.findIndex(
  (player) => player.id === playerId
);
window.mockPlayerListData.splice(playerIndex, 1);
```

**Firebase Equivalent:**

```javascript
// Remove coach-player relationship
const q = query(
  collection(db, "coach_players"),
  where("coachId", "==", currentUserId),
  where("playerId", "==", playerId)
);
const snapshot = await getDocs(q);
snapshot.forEach(async (doc) => {
  await deleteDoc(doc.ref);
});

// Update player's record to remove coach
await updateDoc(doc(db, "users", playerId), {
  coachId: null,
  updatedAt: new Date(),
});
```

**Data Structure (Firestore Document - coach_players collection):**

```javascript
{
  id: "auto_generated_id",
  coachId: "string", // Coach's user ID
  playerId: "string", // Player's user ID
  playerEmail: "string",
  playerName: "string",
  status: "pending" | "accepted" | "declined",
  invitedAt: "timestamp",
  acceptedAt: "timestamp | null",
  notes: "string" // Optional coach notes about player
}
```

---

## 7. Dashboard Data Aggregation

### 7.1 Player Dashboard Statistics

**Action:** Calculate player metrics and recent activities  
**Current Mock Implementation:**

```javascript
// From app.js - mockPlayerData
const metrics = {
  trainingSessions: 3,
  matchesPlayed: 4,
  improvementRate: 0,
  goalsAchieved: 1,
  bestWinStreak: 2,
};
```

**Firebase Equivalent:**

```javascript
// Aggregate data from multiple collections
const trainingCount = await getCountFromServer(
  query(collection(db, "training"), where("playerId", "==", currentUserId))
);

const matchesCount = await getCountFromServer(
  query(collection(db, "matches"), where("playerId", "==", currentUserId))
);

const completedGoals = await getCountFromServer(
  query(
    collection(db, "goals"),
    where("playerId", "==", currentUserId),
    where("status", "==", "Completed")
  )
);
```

### 7.2 Coach Dashboard Statistics

**Action:** Get aggregated statistics for all coach's players  
**Current Mock Implementation:**

```javascript
// From coach-dashboard.js - getPlayerData()
const playerData = {
  training: mockTrainingData.filter((item) => item.playerId === playerId),
  matches: mockMatchesData.filter((item) => item.playerId === playerId),
  goals: mockGoalsData.filter((item) => item.playerId === playerId),
};
```

**Firebase Equivalent:**

```javascript
// Get data for specific player under coach
const trainingData = await getDocs(
  query(
    collection(db, "training"),
    where("playerId", "==", playerId),
    where("coachId", "==", currentUserId)
  )
);

const matchesData = await getDocs(
  query(
    collection(db, "matches"),
    where("playerId", "==", playerId),
    where("coachId", "==", currentUserId)
  )
);

const goalsData = await getDocs(
  query(
    collection(db, "goals"),
    where("playerId", "==", playerId),
    where("coachId", "==", currentUserId)
  )
);
```

---

## 8. Security Rules Considerations

### 8.1 User Data Access

- Users can only read/write their own user document
- Coaches can read basic info of their assigned players

### 8.2 Training/Matches/Goals Access

- Players can read/write only their own records
- Coaches can read/write records of their assigned players only

### 8.3 Schedule Events Access

- Users can read events where they are participants
- Only event creators can edit/delete events

### 8.4 Coach-Player Relationships

- Only coaches can create coach_players relationships
- Players can accept/decline invitations
- Both parties can end the relationship

---

## 9. Migration Notes

1. **Data Mapping**: All current `playerId` references will be replaced with Firebase Auth UIDs
2. **Timestamps**: Replace `Date.now()` IDs with Firestore auto-generated IDs and proper timestamps
3. **Real-time Updates**: Consider using Firestore real-time listeners for live data updates
4. **Batch Operations**: Use Firestore batch writes for operations affecting multiple documents
5. **Offline Support**: Leverage Firestore's offline capabilities for better user experience
6. **Error Handling**: Implement proper error handling for all Firebase operations
7. **Loading States**: Add loading indicators for all async operations

---

## 10. Implementation Priority

1. **Phase 1**: User Authentication (Sign up, Login, User management)
2. **Phase 2**: Core CRUD operations (Training, Matches, Goals, Schedule)
3. **Phase 3**: Coach-Player relationships and permissions
4. **Phase 4**: Dashboard data aggregation and analytics
5. **Phase 5**: Real-time features and offline support
6. **Phase 6**: Security rules testing and optimization

---

_This checklist will be updated as the Firebase integration progresses. Each completed operation should be marked and tested thoroughly before moving to the next._
