// Mock data for Player Dashboard (static prototype)
// This will be used by player-dashboard.js to populate the UI
window.mockPlayerData = {
  dateString: "Thursday, September 4, 2025",
  metrics: {
    trainingSessions: 3,
    matchesPlayed: 4,
    improvementRate: 0,
    goalsAchieved: 1,
    bestWinStreak: 2,
  },
  recentActivities: [
    {
      title: "Training Session - Footwork",
      timestamp: "1 day ago",
    },
  ],
};

// Mock Training Data for Training Page
window.mockTrainingData = [
  {
    id: 1,
    playerId: "player1",
    date: "2025-09-03",
    duration: 90,
    type: "Footwork & Agility",
    intensity: "High",
    coachComments:
      "Great improvement in lateral movement. Focus on recovery position next session.",
    location: "Court 1",
    exercises: ["Ladder drills", "Shadow badminton", "Multi-shuttle"],
  },
  {
    id: 2,
    playerId: "player1",
    date: "2025-09-01",
    duration: 75,
    type: "Technical Skills",
    intensity: "Medium",
    coachComments:
      "Backhand clear technique is improving. Work on consistency.",
    location: "Court 2",
    exercises: ["Clear practice", "Drop shots", "Net play"],
  },
  {
    id: 3,
    playerId: "player2",
    date: "2025-08-30",
    duration: 120,
    type: "Match Simulation",
    intensity: "High",
    coachComments:
      "Excellent game awareness. Continue developing attacking shots.",
    location: "Court 1",
    exercises: ["Full court practice", "Point play", "Tactical scenarios"],
  },
  {
    id: 4,
    playerId: "player2",
    date: "2025-08-28",
    duration: 60,
    type: "Conditioning",
    intensity: "High",
    coachComments: "Good stamina building. Recovery time is decreasing.",
    location: "Gym",
    exercises: ["Circuit training", "Plyometrics", "Cardio intervals"],
  },
  {
    id: 5,
    playerId: "player3",
    date: "2025-08-26",
    duration: 85,
    type: "Serve & Return",
    intensity: "Medium",
    coachComments: "Serve placement much better. Work on deceptive serves.",
    location: "Court 3",
    exercises: ["Serve practice", "Return drills", "Service games"],
  },
  {
    id: 6,
    playerId: "player3",
    date: "2025-08-24",
    duration: 100,
    type: "Doubles Strategy",
    intensity: "Medium",
    coachComments:
      "Good communication with partner. Focus on court positioning.",
    location: "Court 1",
    exercises: ["Doubles rotation", "Attack formations", "Defense patterns"],
  },
];

// Mock Matches Data for Matches Page
window.mockMatchesData = [
  {
    id: 1,
    playerId: "player1",
    date: "2025-09-02",
    opponent: "Alex Chen",
    yourScore: 21,
    opponentScore: 18,
    yourScore2: 21,
    opponentScore2: 16,
    result: "Win",
    matchType: "Singles",
    duration: 45,
    notes:
      "Great match! Improved net play really made the difference in both sets.",
  },
  {
    id: 2,
    playerId: "player1",
    date: "2025-08-30",
    opponent: "Sarah Williams",
    yourScore: 19,
    opponentScore: 21,
    yourScore2: 17,
    opponentScore2: 21,
    result: "Loss",
    matchType: "Singles",
    duration: 52,
    notes:
      "Strong opponent with excellent defense. Need to work on finishing points.",
  },
  {
    id: 3,
    playerId: "player2",
    date: "2025-08-27",
    opponent: "Mike & Lisa (Doubles)",
    yourScore: 21,
    opponentScore: 15,
    yourScore2: 21,
    opponentScore2: 19,
    result: "Win",
    matchType: "Doubles",
    duration: 38,
    notes: "Good teamwork with partner. Communication was key to victory.",
  },
  {
    id: 4,
    playerId: "player2",
    date: "2025-08-25",
    opponent: "David Park",
    yourScore: 21,
    opponentScore: 23,
    yourScore2: 21,
    opponentScore2: 17,
    yourScore3: 18,
    opponentScore3: 21,
    result: "Loss",
    matchType: "Singles",
    duration: 68,
    notes:
      "Close three-set match. Stamina training paying off but need mental toughness.",
  },
  {
    id: 5,
    playerId: "player3",
    date: "2025-08-22",
    opponent: "Emma Thompson",
    yourScore: 21,
    opponentScore: 12,
    yourScore2: 21,
    opponentScore2: 8,
    result: "Win",
    matchType: "Singles",
    duration: 28,
    notes: "Dominant performance. Aggressive attacking style worked perfectly.",
  },
  {
    id: 6,
    playerId: "player3",
    date: "2025-08-20",
    opponent: "John & Mark (Doubles)",
    yourScore: 18,
    opponentScore: 21,
    yourScore2: 21,
    opponentScore2: 19,
    yourScore3: 19,
    opponentScore3: 21,
    result: "Loss",
    matchType: "Doubles",
    duration: 61,
    notes:
      "Thrilling three-set doubles match. Need better positioning in crucial points.",
  },
];

// Mock Goals Data for Goals Page
window.mockGoalsData = [
  {
    id: 1,
    playerId: "player1",
    title: "Improve Backhand Clear Consistency",
    description:
      "Achieve 8/10 successful backhand clears to baseline in training sessions",
    targetDate: "2025-10-15",
    progress: 75,
    status: "In Progress",
    category: "Technical",
    priority: "High",
    notes:
      "Making good progress. Need to focus on shuttle trajectory and follow-through.",
  },
  {
    id: 2,
    playerId: "player1",
    title: "Win Local Tournament",
    description: "Place 1st in the City Championship Singles Division",
    targetDate: "2025-11-30",
    progress: 40,
    status: "In Progress",
    category: "Competition",
    priority: "High",
    notes:
      "Training intensely. Need to work on mental toughness under pressure.",
  },
  {
    id: 3,
    playerId: "player2",
    title: "Master Net Play Techniques",
    description: "Develop consistent net shots, net kills, and tight net drops",
    targetDate: "2025-09-30",
    progress: 90,
    status: "Nearly Complete",
    category: "Technical",
    priority: "Medium",
    notes:
      "Excellent progress! Just need to improve consistency in match situations.",
  },
  {
    id: 4,
    playerId: "player2",
    title: "Increase Training Frequency",
    description: "Train 4 times per week consistently for 3 months",
    targetDate: "2025-12-04",
    progress: 60,
    status: "In Progress",
    category: "Fitness",
    priority: "Medium",
    notes:
      "Currently averaging 3 sessions per week. Need better time management.",
  },
  {
    id: 5,
    playerId: "player3",
    title: "Improve Doubles Communication",
    description:
      "Develop better on-court communication and positioning with regular partner",
    targetDate: "2025-10-31",
    progress: 25,
    status: "Just Started",
    category: "Strategy",
    priority: "Medium",
    notes:
      "Started practicing with partner more regularly. Need to work on court coverage.",
  },
  {
    id: 6,
    playerId: "player3",
    title: "Perfect Serve Variations",
    description:
      "Master 5 different serve types: high serve, low serve, flick serve, drive serve, backhand serve",
    targetDate: "2025-09-20",
    progress: 100,
    status: "Completed",
    category: "Technical",
    priority: "High",
    notes:
      "Successfully mastered all serve variations! Can now use them effectively in matches.",
  },
];

// Mock Schedule Data for Schedule Page
window.mockScheduleData = [
  {
    id: 1,
    title: "Training Session - Doubles Strategy",
    date: "2025-09-05",
    time: "18:00",
    type: "Training",
    location: "Court 1",
    participants: ["player1", "player2"],
    notes: "Focus on court positioning and communication with partner",
  },
  {
    id: 2,
    title: "Singles Match vs Alex Chen",
    date: "2025-09-07",
    time: "14:30",
    type: "Match",
    location: "Badminton Club Main Court",
    participants: ["player1"],
    notes: "Championship preparation match",
  },
  {
    id: 3,
    title: "Footwork & Agility Training",
    date: "2025-09-08",
    time: "17:00",
    type: "Training",
    location: "Court 2",
    participants: ["player2"],
    notes: "Ladder drills and shadow badminton exercises",
  },
  {
    id: 4,
    title: "Tournament - City Championship",
    date: "2025-09-12",
    time: "09:00",
    type: "Tournament",
    location: "Sports Complex Arena",
    participants: ["player1", "player2", "player3"],
    notes: "Singles division - arrive 30 minutes early for warm-up",
  },
  {
    id: 5,
    title: "Doubles Practice with Partner",
    date: "2025-09-14",
    time: "16:00",
    type: "Training",
    location: "Court 3",
    participants: ["player2", "player3"],
    notes: "Work on attack formations and defense patterns",
  },
  {
    id: 6,
    title: "Friendly Match - Doubles",
    date: "2025-09-15",
    time: "19:00",
    type: "Match",
    location: "Local Community Center",
    participants: ["player1", "player3"],
    notes: "Casual doubles match with club members",
  },
];

// Mock Player List Data for Coach Dashboard Player Selection
window.mockPlayerListData = [
  {
    id: "player1",
    name: "Alex Chen",
    email: "alex.chen@email.com",
    avatar: "👨‍💼",
    team: "Singles Division",
    status: "Active",
  },
  {
    id: "player2",
    name: "Sarah Williams",
    email: "sarah.williams@email.com",
    avatar: "👩‍💼",
    team: "Doubles Division",
    status: "Active",
  },
  {
    id: "player3",
    name: "Mike Johnson",
    email: "mike.johnson@email.com",
    avatar: "👨‍💼",
    team: "Mixed Doubles",
    status: "Active",
  },
  {
    id: "player4",
    name: "Emma Thompson",
    email: "emma.thompson@email.com",
    avatar: "👩‍💼",
    team: "Singles Division",
    status: "Active",
  },
  {
    id: "player5",
    name: "David Park",
    email: "david.park@email.com",
    avatar: "👨‍💼",
    team: "Doubles Division",
    status: "Active",
  },
];

// Global helper function to get current user role
// TODO: Replace with real auth logic from Phase 7
window.getCurrentUserRole = function () {
  // First, check if the URL has a ?user=coach parameter
  const urlParams = new URLSearchParams(window.location.search);
  const userRole = urlParams.get("user");
  if (userRole === "coach") {
    return "coach";
  }

  // Fall back to checking the current page URL
  const currentPage = window.location.pathname;
  if (currentPage.includes("coach-dashboard.html")) {
    return "coach";
  }
  return "player";
};

// ShuttleStats v2 - Mock Data and Utilities
console.log("app.js loaded successfully");

// Smart logo navigation based on authentication state
// Handle Sign Out buttons
document.addEventListener("DOMContentLoaded", function () {
  const signOutBtn = document.getElementById("signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      console.log("Signing out, redirecting to landing page");
      window.location.href = "index.html";
    });
  }
});
