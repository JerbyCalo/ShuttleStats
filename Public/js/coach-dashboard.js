/**
 * Coach Dashboard JavaScript
 * Handles coach-specific functionality including player selection
 */

// Import Firebase functions for Coach Dashboard
import {
  db,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "../config/firebase-config.js";

/**
 * Calculate and render Training Commitment KPI
 * @param {Array} trainingData - Array of training data
 */
function renderTrainingCommitmentKPI(trainingData) {
  const card = document.getElementById("training-commitment-card");
  const valueElement = card.querySelector(".kpi-value");
  const progressFill = card.querySelector(".kpi-progress-fill");

  if (!trainingData || trainingData.length === 0) {
    valueElement.textContent = "--";
    progressFill.style.width = "0%";
    return;
  }

  // Calculate last 30 days training commitment
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = trainingData.filter(
    (session) => new Date(session.date) >= thirtyDaysAgo
  );

  // Target: 12 sessions per month (3 per week)
  const targetSessions = 12;
  const actualSessions = recentSessions.length;
  const percentage = Math.min(
    Math.round((actualSessions / targetSessions) * 100),
    100
  );

  valueElement.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;
}

/**
 * Calculate and render Current Focus KPI
 * @param {Array} goalsData - Array of goals data
 */
function renderCurrentFocusKPI(goalsData) {
  const card = document.getElementById("current-focus-card");
  const valueElement = card.querySelector(".kpi-value");
  const secondaryElement = card.querySelector(".kpi-secondary");

  if (!goalsData || goalsData.length === 0) {
    valueElement.textContent = "--";
    secondaryElement.textContent = "No goals set";
    return;
  }

  // Find most common category from active goals
  const activeGoals = goalsData.filter((goal) => goal.status !== "Completed");

  if (activeGoals.length === 0) {
    valueElement.textContent = "Complete!";
    secondaryElement.textContent = "All goals achieved";
    return;
  }

  const categoryCount = {};
  activeGoals.forEach((goal) => {
    categoryCount[goal.category] = (categoryCount[goal.category] || 0) + 1;
  });

  const mostCommonCategory = Object.keys(categoryCount).reduce((a, b) =>
    categoryCount[a] > categoryCount[b] ? a : b
  );

  valueElement.textContent = mostCommonCategory;
  secondaryElement.textContent = `${categoryCount[mostCommonCategory]} active goals`;
}

/**
 * Render recent training sessions
 * @param {Array} trainingData - Array of training data
 */
function renderRecentTraining(trainingData) {
  const container = document.getElementById("recent-training-container");
  const contentDiv = container.querySelector(".section-content");

  if (!trainingData || trainingData.length === 0) {
    showEmptyState("recent-training-container", {
      icon: "🏸",
      title: "No Training Sessions",
      message: "No recent training sessions found for this player.",
    });
    return;
  }

  // Sort by date (newest first) and take first 3
  const recentTraining = trainingData
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const trainingHTML = recentTraining
    .map(
      (training) => `
    <div class="training-item">
      <div class="item-header">
        <h4 class="item-title">${training.type}</h4>
        <span class="item-date">${new Date(
          training.date
        ).toLocaleDateString()}</span>
      </div>
      <div class="item-details">
        <p><strong>Duration:</strong> ${training.duration} minutes</p>
        <p><strong>Intensity:</strong> ${training.intensity}</p>
        <p><strong>Location:</strong> ${training.location}</p>
        ${
          training.coachComments
            ? `<p><strong>Notes:</strong> ${training.coachComments}</p>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  contentDiv.innerHTML = trainingHTML;
}

/**
 * Render recent matches
 * @param {Array} matchesData - Array of matches data
 */
function renderUpcomingMatches(matchesData) {
  const container = document.getElementById("upcoming-matches-container");
  const contentDiv = container.querySelector(".section-content");

  if (!matchesData || matchesData.length === 0) {
    showEmptyState("upcoming-matches-container", {
      icon: "🏆",
      title: "No Matches",
      message: "No matches found for this player.",
    });
    return;
  }

  // For demo purposes, show recent matches since we don't have future dates
  const recentMatches = matchesData
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 2);

  const matchesHTML = recentMatches
    .map(
      (match) => `
    <div class="match-item">
      <div class="item-header">
        <h4 class="item-title">vs ${match.opponent}</h4>
        <span class="item-date">${new Date(
          match.date
        ).toLocaleDateString()}</span>
      </div>
      <div class="item-details">
        <p><strong>Type:</strong> ${match.matchType}</p>
        <p><strong>Score:</strong> ${match.yourScore}-${match.opponentScore}${
        match.yourScore2 ? `, ${match.yourScore2}-${match.opponentScore2}` : ""
      }</p>
        <p><strong>Result:</strong> <span class="status-badge status-${match.result.toLowerCase()}">${
        match.result
      }</span></p>
        <p><strong>Duration:</strong> ${match.duration} minutes</p>
        ${match.notes ? `<p><strong>Notes:</strong> ${match.notes}</p>` : ""}
      </div>
    </div>
  `
    )
    .join("");

  contentDiv.innerHTML = matchesHTML;
}

/**
 * Render current goals
 * @param {Array} goalsData - Array of goals data
 */
function renderCurrentGoals(goalsData) {
  const container = document.getElementById("current-goals-container");
  const contentDiv = container.querySelector(".section-content");

  if (!goalsData || goalsData.length === 0) {
    showEmptyState("current-goals-container", {
      icon: "🎯",
      title: "No Goals",
      message: "No goals found for this player.",
    });
    return;
  }

  // Filter for incomplete goals and sort by priority
  const activeGoals = goalsData
    .filter((goal) => goal.status !== "Completed")
    .sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  if (activeGoals.length === 0) {
    showEmptyState("current-goals-container", {
      icon: "🎉",
      title: "All Goals Completed!",
      message: "This player has achieved all their goals. Great work!",
    });
    return;
  }

  const goalsHTML = activeGoals
    .map(
      (goal) => `
    <div class="goal-item">
      <div class="item-header">
        <h4 class="item-title">${goal.title}</h4>
        <span class="status-badge status-${goal.status
          .toLowerCase()
          .replace(" ", "-")}">${goal.status}</span>
      </div>
      <div class="item-details">
        <p>${goal.description}</p>
        <p><strong>Target Date:</strong> ${new Date(
          goal.targetDate
        ).toLocaleDateString()}</p>
        <p><strong>Priority:</strong> ${goal.priority}</p>
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${goal.progress}%"></div>
          </div>
          <span class="progress-text">${goal.progress}%</span>
        </div>
        ${goal.notes ? `<p><strong>Notes:</strong> ${goal.notes}</p>` : ""}
      </div>
    </div>
  `
    )
    .join("");

  contentDiv.innerHTML = goalsHTML;
}

/**
 * Show loading state for all sections
 */
function showLoadingState() {
  const sections = [
    "recent-training-container",
    "upcoming-matches-container",
    "current-goals-container",
  ];

  sections.forEach((sectionId) => {
    const container = document.getElementById(sectionId);
    const contentDiv = container.querySelector(".section-content");
    contentDiv.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        Loading data...
      </div>
    `;
  });
}

/**
 * Update the dashboard UI with player-specific data
 * @param {string} playerId - The ID of the selected player
 */
async function updateDashboardUI(playerId) {
  if (!playerId) {
    // Clear all containers when no player is selected
    renderTrainingCommitmentKPI([]);
    renderCurrentFocusKPI([]);
    renderRecentTraining([]);
    renderUpcomingMatches([]);
    renderCurrentGoals([]);
    return;
  }

  if (!window.currentUser) {
    console.warn("No authenticated user for updating dashboard");
    return;
  }

  // Show loading spinners for all sections
  showLocalLoader("recent-training-container", {
    text: "Loading training data...",
    size: "small",
  });

  showLocalLoader("upcoming-matches-container", {
    text: "Loading matches...",
    size: "small",
  });

  showLocalLoader("current-goals-container", {
    text: "Loading goals...",
    size: "small",
  });

  try {
    // Get filtered data for the selected player from Firestore
    const playerData = await getPlayerData(playerId);

    // Update KPI cards first
    renderTrainingCommitmentKPI(playerData.training);
    renderCurrentFocusKPI(playerData.goals);

    // Staggered loading of sections for better UX
    renderRecentTraining(playerData.training);
    hideLoadingSpinner("recent-training-container");

    await simulateNetworkDelay(200);

    renderUpcomingMatches(playerData.matches);
    hideLoadingSpinner("upcoming-matches-container");

    await simulateNetworkDelay(200);

    renderCurrentGoals(playerData.goals);
    hideLoadingSpinner("current-goals-container");

    console.log("Dashboard UI updated for player:", playerId);
  } catch (error) {
    console.error("Error updating dashboard UI:", error);

    // Hide loading spinners on error
    hideLoadingSpinner("recent-training-container");
    hideLoadingSpinner("upcoming-matches-container");
    hideLoadingSpinner("current-goals-container");

    // Show error states
    const errorMessage =
      error.code === "permission-denied"
        ? "You don't have permission to view this player's data."
        : "Unable to load player data. Please try refreshing the page.";

    showEmptyState("recent-training-container", {
      icon: "⚠️",
      title: "Error Loading Training",
      message: errorMessage,
    });

    showEmptyState("upcoming-matches-container", {
      icon: "⚠️",
      title: "Error Loading Matches",
      message: errorMessage,
    });

    showEmptyState("current-goals-container", {
      icon: "⚠️",
      title: "Error Loading Goals",
      message: errorMessage,
    });
  }
}

/**
 * Get filtered data for a specific player from Firestore
 * @param {string} playerId - The ID of the player to filter data for
 * @returns {Object} Object containing filtered training, matches, and goals data
 */
async function getPlayerData(playerId) {
  // Validate playerId parameter
  if (!playerId || !window.currentUser) {
    console.warn(
      "getPlayerData called with empty playerId or no authenticated user"
    );
    return {
      training: [],
      matches: [],
      goals: [],
    };
  }

  try {
    console.log(`Fetching data for player ${playerId} from Firestore...`);

    // Get training data
    const trainingQuery = query(
      collection(db, "training"),
      where("playerId", "==", playerId),
      where("coachId", "==", window.currentUser.uid),
      orderBy("date", "desc")
    );
    const trainingSnapshot = await getDocs(trainingQuery);
    const trainingData = trainingSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get matches data
    const matchesQuery = query(
      collection(db, "matches"),
      where("playerId", "==", playerId),
      where("coachId", "==", window.currentUser.uid),
      orderBy("date", "desc")
    );
    const matchesSnapshot = await getDocs(matchesQuery);
    const matchesData = matchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get goals data
    const goalsQuery = query(
      collection(db, "goals"),
      where("playerId", "==", playerId),
      where("coachId", "==", window.currentUser.uid),
      orderBy("targetDate", "asc")
    );
    const goalsSnapshot = await getDocs(goalsQuery);
    const goalsData = goalsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched data for player ${playerId}:`, {
      training: trainingData.length + " records",
      matches: matchesData.length + " records",
      goals: goalsData.length + " records",
    });

    return {
      training: trainingData,
      matches: matchesData,
      goals: goalsData,
    };
  } catch (error) {
    console.error("Error fetching player data from Firestore:", error);

    // Return empty data on error
    return {
      training: [],
      matches: [],
      goals: [],
    };
  }
}

/**
 * Load and populate the player selector dropdown
 */
async function loadPlayerSelector() {
  // Get the player selector element
  const playerSelector = document.getElementById("playerSelector");

  if (!playerSelector) {
    console.error("Player selector element not found");
    return;
  }

  if (!window.currentUser) {
    console.warn("No authenticated user for loading player selector");
    return;
  }

  // Clear existing options (except the default one)
  playerSelector.innerHTML = '<option value="">-- Choose a player --</option>';

  try {
    // Fetch coach's players from Firestore
    const coachPlayersQuery = query(
      collection(db, "coach_players"),
      where("coachId", "==", window.currentUser.uid),
      where("status", "==", "accepted")
    );

    const coachPlayersSnapshot = await getDocs(coachPlayersQuery);

    if (coachPlayersSnapshot.empty) {
      console.log("No players found for this coach");
      const option = document.createElement("option");
      option.disabled = true;
      option.textContent = "No players assigned";
      playerSelector.appendChild(option);
      return;
    }

    // Get full user details for each player
    const playerPromises = coachPlayersSnapshot.docs.map(
      async (relationDoc) => {
        const relation = relationDoc.data();

        // For now, we'll use the player data from the relationship
        // In a full implementation, you'd fetch from users collection
        return {
          id: relation.playerId,
          name: relation.playerName,
          email: relation.playerEmail,
        };
      }
    );

    const players = await Promise.all(playerPromises);

    // Populate the dropdown with player options
    players.forEach((player) => {
      const option = document.createElement("option");
      option.value = player.id;
      option.textContent = player.name;
      playerSelector.appendChild(option);
    });

    console.log("Player selector loaded with", players.length, "players");
  } catch (error) {
    console.error("Error loading player selector:", error);
    const option = document.createElement("option");
    option.disabled = true;
    option.textContent = "Error loading players";
    playerSelector.appendChild(option);
  }

  // Add event listener for selection changes
  playerSelector.addEventListener("change", (event) => {
    const selectedPlayerId = event.target.value;
    console.log("Selected player:", selectedPlayerId);

    // Also log the player name for debugging
    const selectedOption = event.target.options[event.target.selectedIndex];
    if (selectedPlayerId) {
      console.log("Selected player name:", selectedOption.textContent);

      // Update the dashboard UI with the selected player's data
      updateDashboardUI(selectedPlayerId);
    } else {
      console.log("No player selected");
      // Clear the dashboard when no player is selected
      updateDashboardUI(null);
    }
  });
}

/**
 * Initialize the coach dashboard when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("Coach dashboard initializing...");

  // Wait for user authentication
  if (!window.currentUser) {
    console.log("Waiting for user authentication...");

    // Listen for auth state changes
    window.addEventListener("authStateChanged", async function (event) {
      if (event.detail.user) {
        console.log("User authenticated, loading player selector");
        await loadPlayerSelector();
      }
    });

    // If already authenticated but event didn't fire yet
    setTimeout(async () => {
      if (window.currentUser) {
        await loadPlayerSelector();
      }
    }, 1000);
  } else {
    loadPlayerSelector();
  }

  console.log("Coach dashboard initialized");
});
