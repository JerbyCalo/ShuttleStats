// ShuttleStats v2 - Goals Page Logic
console.log("goals.js loaded");

// Import Firebase functions for Goals operations
import {
  db,
  auth,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDoc,
} from "../config/firebase-config.js";

// Import authentication utilities for better role detection
import { checkAuthenticationState } from "./auth-utils.js";

(function () {
  // Track if we're in coach mode
  let isCoachMode = false;
  let currentFilteredData = [];

  // Data cleaning function to prevent undefined values
  function cleanGoalData(data) {
    const cleaned = {};

    // Clean string fields
    ["title", "description", "category", "priority", "status", "notes"].forEach(
      (field) => {
        cleaned[field] =
          data[field] && typeof data[field] === "string"
            ? data[field].trim()
            : "";
      }
    );

    // Clean date field
    cleaned.targetDate = data.targetDate || "";

    // Clean number field (progress)
    cleaned.progress =
      typeof data.progress === "number" && !isNaN(data.progress)
        ? Math.max(0, Math.min(100, data.progress))
        : 0;

    // Add required IDs if provided
    if (data.playerId) cleaned.playerId = data.playerId;
    if (data.coachId) cleaned.coachId = data.coachId;

    return cleaned;
  }

  // Format date to readable string
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  // Get status badge class
  // Get status badge class
  function getStatusClass(status) {
    switch (status.toLowerCase()) {
      case "completed":
        return "status-completed";
      case "in progress":
        return "status-progress";
      case "nearly complete":
        return "status-nearly";
      case "just started":
        return "status-started";
      case "not started":
        return "status-not-started";
      default:
        return "status-not-started";
    }
  }

  // Get priority badge class
  function getPriorityClass(priority) {
    switch (priority.toLowerCase()) {
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      case "low":
        return "priority-low";
      default:
        return "priority-medium";
    }
  }

  // Calculate days until target date
  function getDaysUntilTarget(targetDate) {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} days left`;
    }
  }

  // Get player name by ID (for coach mode) - Updated to use real data
  async function getPlayerName(playerId) {
    try {
      const playerDoc = await getDoc(doc(db, "users", playerId));
      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        return `${playerData.name.first} ${playerData.name.last}`.trim();
      }
      return "Unknown Player";
    } catch (error) {
      console.error("Error fetching player name:", error);
      return "Unknown Player";
    }
  }

  // Create goal card
  async function createGoalCard(goal) {
    const card = document.createElement("div");
    card.className = "goal-card";
    card.dataset.goalId = goal.id;

    const daysUntilTarget = getDaysUntilTarget(goal.targetDate);
    const isOverdue = daysUntilTarget.includes("overdue");
    const isDueToday = daysUntilTarget.includes("Due today");

    // For coach mode, add player name to the header
    let playerInfo = "";
    if (isCoachMode) {
      const playerName = await getPlayerName(goal.playerId);
      playerInfo = `<div class="player-info" style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;">
        👤 ${playerName}
       </div>`;
    }

    card.innerHTML = `
      ${playerInfo}
      <div class="goal-card-header">
        <div class="goal-info">
          <h4 class="goal-title">${goal.title}</h4>
          <div class="goal-meta">
            <span class="category-badge">${goal.category}</span>
            <span class="priority-badge ${getPriorityClass(goal.priority)}">${
      goal.priority
    }</span>
          </div>
        </div>
        <div class="goal-status">
          <span class="status-badge ${getStatusClass(goal.status)}">${
      goal.status
    }</span>
        </div>
      </div>
      
      <div class="goal-card-content">
        <p class="goal-description">${goal.description}</p>
        
        <div class="goal-progress">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-percentage">${goal.progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${goal.progress}%"></div>
          </div>
        </div>
        
        <div class="goal-target">
          <span class="target-icon">🎯</span>
          <span class="target-date">Target: ${formatDate(
            goal.targetDate
          )}</span>
          <span class="days-left ${isOverdue ? "overdue" : ""} ${
      isDueToday ? "due-today" : ""
    }">(${daysUntilTarget})</span>
        </div>
        
        ${
          goal.notes
            ? `
        <div class="goal-notes">
          <strong>Notes:</strong>
          <p class="notes-text">${goal.notes}</p>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="goal-card-actions">
        <button class="action-btn edit-btn edit-goal-btn" data-goal-id="${
          goal.id
        }" title="Edit Goal">
          <span class="btn-icon">✏️</span>
          <span class="btn-text">Edit</span>
        </button>
        <button class="action-btn delete-btn delete-goal-btn" data-goal-id="${
          goal.id
        }" title="Delete Goal">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Delete</span>
        </button>
      </div>
    `;

    return card;
  }

  // Filter goals data by player ID (for coach mode)
  async function filterGoalsData(playerId) {
    if (!window.currentUser) {
      console.error("No authenticated user found");
      return [];
    }

    try {
      let goalsQuery;

      if (window.currentUserData?.role === "coach") {
        if (playerId && playerId !== "") {
          // Coach viewing specific player's goals (no more "all" option)
          goalsQuery = query(
            collection(db, "goals"),
            where("coachId", "==", window.currentUser.uid),
            where("playerId", "==", playerId),
            orderBy("targetDate", "asc")
          );
        } else {
          // If no specific player is provided, return empty array
          console.log("No player selected, returning empty array");
          return [];
        }
      } else {
        // Player viewing their own goals
        goalsQuery = query(
          collection(db, "goals"),
          where("playerId", "==", window.currentUser.uid),
          orderBy("targetDate", "asc")
        );
      }

      const querySnapshot = await getDocs(goalsQuery);
      const goals = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Filtered goals data: ${goals.length} goals found`);
      return goals;
    } catch (error) {
      console.error("Error filtering goals data:", error);

      // Show user-friendly error message
      if (typeof showToast === "function") {
        showToast("Error loading goals data. Please try again.", "error");
      }

      return [];
    }
  }

  // Update goals statistics (works with filtered data in coach mode)
  function updateGoalsStats(goalsData = null) {
    const totalGoalsEl = document.getElementById("totalGoals");
    const completionRateEl = document.getElementById("completionRate");

    const dataToUse = goalsData || currentFilteredData || [];

    if (!dataToUse || dataToUse.length === 0) {
      if (totalGoalsEl) totalGoalsEl.textContent = "0";
      if (completionRateEl) completionRateEl.textContent = "0%";
      return;
    }

    const totalGoals = dataToUse.length;
    const completedGoals = dataToUse.filter(
      (goal) => goal.status.toLowerCase() === "completed"
    ).length;
    const completionRate =
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    if (totalGoalsEl) totalGoalsEl.textContent = totalGoals;
    if (completionRateEl) completionRateEl.textContent = `${completionRate}%`;

    console.log(
      `Stats updated: ${totalGoals} goals, ${completionRate}% completion rate`
    );
  }

  // Render all goals (works with filtered data in coach mode)
  async function renderGoals(goalsData = null) {
    const container = document.getElementById("goalsContainer");

    if (!container) {
      console.error("Goals container not found");
      return;
    }

    // Show loading spinner
    showLocalLoader("goalsContainer", {
      text: "Loading goals...",
      size: "normal",
    });

    try {
      let dataToRender;

      // If specific data is provided, use it
      if (goalsData !== null) {
        dataToRender = goalsData;
      } else {
        // Fetch from Firestore based on user role
        if (!window.currentUser) {
          throw new Error("No authenticated user found");
        }

        if (isCoachMode) {
          // Coach mode: Use current filtered data or fetch all
          dataToRender = currentFilteredData;
        } else {
          // Player mode: Fetch player's goals
          const goalsQuery = query(
            collection(db, "goals"),
            where("playerId", "==", window.currentUser.uid),
            orderBy("targetDate", "asc")
          );

          const querySnapshot = await getDocs(goalsQuery);
          dataToRender = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
      }

      // Clear existing content after loading
      container.innerHTML = "";

      // Hide loading spinner
      hideLoadingSpinner("goalsContainer");

      // Check if we have goals data
      if (!dataToRender || dataToRender.length === 0) {
        const emptyMessage = isCoachMode ? "" : "";

        showEmptyState("goalsContainer", {
          icon: "🎯",
          title: "No Goals Set Yet",
          message: emptyMessage,
          actionText: "+ Set New Goal",
          onAction: () => {
            if (window.openSetGoalModal) {
              window.openSetGoalModal();
            }
          },
        });

        updateGoalsStats(dataToRender);
        return;
      }

      // Sort goals by priority and target date
      const sortedGoals = [...dataToRender].sort((a, b) => {
        // First sort by status (In Progress first, then others)
        if (a.status !== b.status) {
          if (a.status.toLowerCase().includes("progress")) return -1;
          if (b.status.toLowerCase().includes("progress")) return 1;
          if (a.status.toLowerCase() === "completed") return 1;
          if (b.status.toLowerCase() === "completed") return -1;
        }

        // Then by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority.toLowerCase()] || 1;
        const bPriority = priorityOrder[b.priority.toLowerCase()] || 1;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Finally by target date (closest first)
        return new Date(a.targetDate) - new Date(b.targetDate);
      });

      // Create and append goal cards (now async in renderGoals)
      for (const goal of sortedGoals) {
        const card = await createGoalCard(goal);
        container.appendChild(card);
      }

      // Update statistics
      updateGoalsStats(sortedGoals);

      console.log(`Rendered ${sortedGoals.length} goals`);
    } catch (error) {
      console.error("Error rendering goals:", error);
      hideLoadingSpinner("goalsContainer");

      // Show user-friendly error message
      let errorMessage =
        "Unable to load goals. Please try refreshing the page.";
      if (error.message.includes("requires an index")) {
        errorMessage =
          "Database indexes are being created. Please try again in a few minutes.";
      }

      showEmptyState("goalsContainer", {
        icon: "⚠️",
        title: "Error Loading Goals",
        message: errorMessage,
      });

      if (typeof showToast === "function") {
        showToast(
          "Error loading goals. Please check your connection.",
          "error"
        );
      }
    }
  }

  // Create and inject player filter dropdown (coach mode only) - Updated for Firestore
  async function createPlayerFilterDropdown() {
    if (!isCoachMode) {
      return;
    }

    const currentUserId = sessionStorage.getItem("currentUserId");
    if (!currentUserId) {
      console.error("No authenticated user for player dropdown");
      return;
    }

    try {
      // Create dropdown container
      const filterContainer = document.createElement("div");
      filterContainer.style.cssText = `
        margin: 20px 0;
        padding: 20px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;

      // Create label
      const label = document.createElement("label");
      label.htmlFor = "playerFilterDropdown";
      label.textContent = "Filter by Player:";
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--text);
        font-size: 1rem;
      `;

      // Create dropdown
      const dropdown = document.createElement("select");
      dropdown.id = "playerFilterDropdown";
      dropdown.className = "form-control";
      dropdown.style.cssText = `
        width: 100%;
        max-width: 300px;
        padding: 12px 16px;
        border: 2px solid var(--border);
        border-radius: 8px;
        font-size: 1rem;
        background: var(--card);
        color: var(--text);
        cursor: pointer;
        transition: border-color 0.3s ease;
      `;

      // Clear existing options (REMOVE "All Players" option)
      dropdown.innerHTML = "";

      // Fetch coach's players from Firestore
      const coachPlayersQuery = query(
        collection(db, "coach_players"),
        where("coachId", "==", currentUserId),
        where("status", "==", "accepted")
      );

      const querySnapshot = await getDocs(coachPlayersQuery);

      if (querySnapshot.empty) {
        // Show "No Players" message
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No Players Found";
        dropdown.appendChild(option);
        return;
      }

      // Collect players data
      const players = [];
      for (const doc of querySnapshot.docs) {
        const relationship = doc.data();
        try {
          // Fetch player details
          const playerDoc = await getDoc(
            doc(db, "users", relationship.playerId)
          );
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            players.push({
              id: relationship.playerId,
              name: `${playerData.name.first} ${playerData.name.last}`.trim(),
            });
          }
        } catch (error) {
          console.error("Error fetching player details:", error);
        }
      }

      // Populate dropdown with players only (NO "All Players" option)
      players.forEach((player) => {
        const option = document.createElement("option");
        option.value = player.id;
        option.textContent = player.name;
        dropdown.appendChild(option);
      });

      // Automatically select the first player and load their data
      if (players.length > 0) {
        dropdown.value = players[0].id;
        console.log(`Auto-selected first player: ${players[0].name}`);

        // Load data for the first player immediately
        setTimeout(async () => {
          await window.loadGoals();
        }, 100);
      }

      // Add event listener for filtering
      dropdown.addEventListener("change", async function () {
        const selectedPlayerId = this.value;
        console.log(`Filtering goals data for player: ${selectedPlayerId}`);

        // Use the centralized function to reload data
        await window.loadGoals();
      });

      // Assemble the filter container
      filterContainer.appendChild(label);
      filterContainer.appendChild(dropdown);

      // Find the action bar and insert the filter before it
      const actionBar = document.querySelector(".action-bar");
      if (actionBar && actionBar.parentNode) {
        actionBar.parentNode.insertBefore(filterContainer, actionBar);
      }

      console.log("Player filter dropdown created with Firestore data");
    } catch (error) {
      console.error("Error creating player filter dropdown:", error);

      // Show error message
      if (typeof showToast === "function") {
        showToast("Failed to load player list", "error");
      }
    }
  }

  // Set up coach mode UI transformations
  function setupCoachMode() {
    console.log("Setting up coach mode UI...");

    // Update page title
    const pageTitle = document.querySelector(".page-title h1");
    if (pageTitle) {
      pageTitle.textContent = "My Goals";
    }

    // Update subheading
    const subheading = document.querySelector(".page-title .subheading");
    if (subheading) {
      subheading.textContent = "Manage your personal coaching goals";
    }

    // DO NOT create player filter dropdown for goals - coach manages their own goals
    // createPlayerFilterDropdown(); // REMOVED

    console.log("Coach mode UI setup complete (no player filter for goals)");
  }

  // Set up "Add New Goal" button
  function setupAddGoalButton() {
    const addButton = document.getElementById("addGoalBtn");

    if (addButton) {
      addButton.addEventListener("click", function () {
        console.log("Opening goal modal");

        // Check if modal function exists (from modals.js)
        if (window.openSetGoalModal) {
          window.openSetGoalModal();
        } else {
          console.warn("Goal modal function not available");
          alert("Goal modal will be available when modals.js is loaded");
        }
      });

      console.log("Add goal button set up");
    } else {
      console.warn("Add goal button not found");
    }
  }

  // Helper function to refresh goals data after operations
  async function refreshGoalsData() {
    await window.loadGoals();
  }

  // Delete goal function
  async function deleteGoal(goalId) {
    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to delete this goal? This action cannot be undone."
      )
    ) {
      return;
    }

    // Find the goal card and show loading state
    const goalCard = document.querySelector(`[data-goal-id="${goalId}"]`);
    if (goalCard) {
      showLocalLoader(goalCard.id || "goal-card", {
        text: "Deleting goal...",
        size: "small",
      });
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "goals", goalId));

      console.log("Goal deleted:", goalId);

      // Re-render the goals list
      await refreshGoalsData();

      // Show success message
      showSuccessMessage("Goal deleted successfully!");
    } catch (error) {
      console.error("Goal deletion error:", error);
      if (goalCard) {
        hideLoadingSpinner(goalCard.id || "goal-card");
      }

      let errorMessage = "Unable to delete goal. Please try again.";
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to delete this goal.";
      } else if (error.code === "not-found") {
        errorMessage = "Goal not found. It may have already been deleted.";
      }

      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  }

  // Edit goal function
  async function editGoal(goalId) {
    console.log("=== EDIT GOAL FUNCTION CALLED ===");
    console.log("Goal ID:", goalId);

    try {
      // Find the goal to edit from Firestore
      const goalDoc = await getDoc(doc(db, "goals", goalId));

      if (!goalDoc.exists()) {
        console.error("Goal not found for editing:", goalId);
        if (typeof showToast === "function") {
          showToast("Error: Goal not found.", "error");
        } else {
          alert("Error: Goal not found.");
        }
        return;
      }

      const goal = { id: goalDoc.id, ...goalDoc.data() };
      console.log("Retrieved goal for editing:", goal);

      // Check if modal function exists (from modals.js)
      if (window.openSetGoalModal) {
        console.log("Opening modal for edit...");

        // Set flag to indicate edit mode BEFORE opening modal
        window.editingGoalId = goalId;
        console.log("Set window.editingGoalId =", window.editingGoalId);

        // Open the modal
        window.openSetGoalModal();

        // Pre-populate the form with existing data
        setTimeout(() => {
          console.log("Populating form after modal opens...");
          populateEditForm(goal);
        }, 150); // Slightly longer delay to ensure modal is fully rendered
      } else {
        console.warn("Goal modal function not available");
        if (typeof showToast === "function") {
          showToast(
            "Goal modal is not available. Please refresh the page.",
            "error"
          );
        } else {
          alert("Goal modal will be available when modals.js is loaded");
        }
      }
    } catch (error) {
      console.error("Error fetching goal for edit:", error);
      if (typeof showToast === "function") {
        showToast("Error loading goal data. Please try again.", "error");
      } else {
        alert("Error loading goal data. Please try again.");
      }
    }
  }

  // Populate edit form with goal data
  function populateEditForm(goal) {
    const form = document.getElementById("setGoalForm");
    if (!form) {
      console.error("Goal form not found");
      return;
    }

    console.log("=== POPULATING EDIT FORM ===");
    console.log("Goal data:", goal);

    // Update modal title
    const modalTitle = document.querySelector("#setGoalModal .modal-header h3");
    if (modalTitle) {
      modalTitle.textContent = "Edit Goal";
      console.log("Updated modal title to Edit Goal");
    } else {
      console.warn("Modal title element not found");
    }

    // Update submit button text
    const submitBtn = form.querySelector(".btn-submit");
    if (submitBtn) {
      submitBtn.textContent = "Update Goal";
      console.log("Updated submit button text to Update Goal");
    } else {
      console.warn("Submit button not found");
    }

    // Populate form fields
    const fields = {
      goalTitle: goal.title,
      goalDescription: goal.description,
      goalCategory: goal.category,
      goalPriority: goal.priority,
      goalStatus: goal.status,
      goalTargetDate: goal.targetDate,
      goalProgress: goal.progress,
      goalNotes: goal.notes,
    };

    console.log("Populating fields:", fields);

    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field && value !== undefined) {
        field.value = value;
        console.log(`Set ${fieldId} = ${value}`);

        // For range input, also update the progress display if it exists
        if (fieldId === "goalProgress") {
          const progressValue = document.querySelector(".progress-value");
          if (progressValue) {
            progressValue.textContent = value + "%";
          }
        }
      } else if (!field) {
        console.warn(`Field ${fieldId} not found in form`);
      }
    });

    console.log("Form populated with goal data successfully");
  }

  // Show success message
  function showSuccessMessage(message) {
    // Use the new toast system if available, otherwise fallback to basic implementation
    if (typeof showToast === "function") {
      showToast(message, "success");
    } else {
      // Fallback for when toast.js is not loaded
      const successDiv = document.createElement("div");
      successDiv.className = "success-message";
      successDiv.textContent = message;
      document.body.appendChild(successDiv);
      setTimeout(() => {
        successDiv.remove();
      }, 3000);
    }

    console.log("Success message shown:", message);
  }

  // Centralized function to load goals (similar to matches and training)
  window.loadGoals = async function () {
    console.log("Loading goals...");

    const container = document.getElementById("goalsContainer");
    if (!container) {
      console.error("Goals container not found");
      return;
    }

    // Show loading spinner
    showLocalLoader("goalsContainer", {
      text: "Loading goals...",
      size: "normal",
    });

    try {
      const currentUserId = sessionStorage.getItem("currentUserId");
      if (!currentUserId) {
        throw new Error("User not authenticated");
      }

      let dataToRender;

      if (isCoachMode) {
        // Coach mode: fetch coach's own goals (not player goals)
        if (!window.currentUser) {
          throw new Error("User not authenticated");
        }

        const coachGoalsQuery = query(
          collection(db, "goals"),
          where("playerId", "==", window.currentUser.uid), // Coach's own goals
          orderBy("targetDate", "asc")
        );

        const querySnapshot = await getDocs(coachGoalsQuery);
        dataToRender = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`Loaded ${dataToRender.length} goals for coach`);
        currentFilteredData = dataToRender;
      } else {
        // Player mode: fetch user's own goals
        if (!window.currentUser) {
          throw new Error("User not authenticated");
        }

        const goalsQuery = query(
          collection(db, "goals"),
          where("playerId", "==", window.currentUser.uid),
          orderBy("targetDate", "asc")
        );

        const querySnapshot = await getDocs(goalsQuery);
        dataToRender = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      // Clear existing content after loading
      container.innerHTML = "";

      // Hide loading spinner
      hideLoadingSpinner("goalsContainer");

      // Check if we have goals data
      if (!dataToRender || dataToRender.length === 0) {
        const emptyMessage = isCoachMode ? "" : "";

        showEmptyState("goalsContainer", {
          icon: "🎯",
          title: "No Goals Set Yet",
          message: emptyMessage,
          actionText: "+ Set New Goal",
          onAction: () => {
            if (window.openSetGoalModal) {
              window.openSetGoalModal();
            }
          },
        });

        updateGoalsStats(dataToRender);
        return;
      }

      // Sort goals by priority and target date
      const sortedGoals = [...dataToRender].sort((a, b) => {
        // First sort by status (In Progress first, then others)
        if (a.status !== b.status) {
          if (a.status.toLowerCase().includes("progress")) return -1;
          if (b.status.toLowerCase().includes("progress")) return 1;
          if (a.status.toLowerCase() === "completed") return 1;
          if (b.status.toLowerCase() === "completed") return -1;
        }

        // Then by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority.toLowerCase()] || 1;
        const bPriority = priorityOrder[b.priority.toLowerCase()] || 1;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Finally by target date (closest first)
        return new Date(a.targetDate) - new Date(b.targetDate);
      });

      // Create and append goal cards (now async in loadGoals)
      for (const goal of sortedGoals) {
        const card = await createGoalCard(goal);
        container.appendChild(card);
      }

      // Update statistics
      updateGoalsStats(sortedGoals);

      console.log(`Loaded and rendered ${sortedGoals.length} goals`);
    } catch (error) {
      console.error("Error loading goals:", error);
      hideLoadingSpinner("goalsContainer");

      showEmptyState("goalsContainer", {
        icon: "⚠️",
        title: "Error Loading Goals",
        message:
          error.message === "User not authenticated"
            ? "Please log in to view your goals."
            : "Unable to load goals. Please try refreshing the page.",
      });
    }
  };

  // Authentication check function
  function checkAuthenticationState() {
    // Check Firebase auth state first
    if (window.currentUser && window.currentUserData) {
      return {
        authenticated: true,
        user: window.currentUser,
        userData: window.currentUserData,
      };
    }

    // Fallback to sessionStorage check for backward compatibility
    const currentUserId = sessionStorage.getItem("currentUserId");
    const userRole = sessionStorage.getItem("userRole");
    const userName = sessionStorage.getItem("userName");

    if (currentUserId && userRole) {
      console.log("Using sessionStorage authentication data");
      return {
        authenticated: true,
        user: { uid: currentUserId },
        userData: { role: userRole, name: userName },
      };
    }

    return { authenticated: false, user: null, userData: null };
  }

  // Wait for authentication to be ready
  function waitForAuthentication(maxAttempts = 10, interval = 500) {
    return new Promise((resolve) => {
      let attempts = 0;

      const checkAuth = () => {
        const authState = checkAuthenticationState();

        if (authState.authenticated || attempts >= maxAttempts) {
          resolve(authState);
          return;
        }

        attempts++;
        setTimeout(checkAuth, interval);
      };

      checkAuth();
    });
  }

  // Main initialization function
  async function initGoalsPage() {
    console.log("Goals page initializing...");

    // Wait for authentication to be ready
    const authState = await waitForAuthentication();

    if (!authState.authenticated) {
      console.error("No authenticated user found. User needs to log in.");

      // Show error message to user
      if (typeof showToast === "function") {
        showToast("Please log in to view your goals.", "error");
      } else {
        // Fallback if toast system isn't available
        alert("Please log in to view your goals.");
      }

      // Show empty state with login message instead of redirect
      const container = document.getElementById("goalsContainer");
      if (container) {
        showEmptyState("goalsContainer", {
          icon: "🔒",
          title: "Authentication Required",
          message: "Please log in to view and manage your goals.",
          actionText: "Go to Login",
          onAction: () => {
            window.location.href = "index.html";
          },
        });
      }

      return; // Stop initialization
    }

    console.log(
      "Authentication verified:",
      authState.userData?.role || "player"
    );

    // Update global state for backward compatibility
    if (!window.currentUser) {
      window.currentUser = authState.user;
    }
    if (!window.currentUserData) {
      window.currentUserData = authState.userData;
    }

    // Check if user is a coach (from URL parameter or user data)
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserRole = urlParams.get("user");
    const actualUserRole = authState.userData?.role || "player";

    // Determine if we should be in coach mode
    if (urlUserRole === "coach" && actualUserRole === "coach") {
      // Coach mode: Transform page for management view
      isCoachMode = true;
      console.log("Coach mode detected - setting up management interface");

      // Set up coach mode UI
      setupCoachMode();

      // Load goals for coach (their own goals)
      await window.loadGoals();

      // Set up add goal button (works in both modes)
      setupAddGoalButton();
    } else if (urlUserRole === "coach" && actualUserRole !== "coach") {
      // User tried to access coach mode but isn't a coach
      console.warn("User attempted to access coach mode without proper role");

      if (typeof showToast === "function") {
        showToast("You do not have access to coach features.", "error");
      }

      // Redirect to player mode
      window.location.href = "goals.html?user=player";
      return;
    } else {
      // Player mode: Normal functionality
      isCoachMode = false;
      console.log("Player mode - loading normal goals page");

      // Render goals for player
      await renderGoals();

      // Set up add goal button
      setupAddGoalButton();
    }

    // Set up event delegation for goal actions
    setupGoalEventDelegation();

    console.log("Goals page initialized successfully");
  }

  // Set up event delegation for goal actions
  function setupGoalEventDelegation() {
    const container = document.getElementById("goalsContainer");

    if (container) {
      container.addEventListener("click", function (event) {
        // Handle edit goal button clicks
        if (event.target.closest(".edit-goal-btn")) {
          const button = event.target.closest(".edit-goal-btn");
          const goalId = button.dataset.goalId;

          if (goalId) {
            console.log("Edit goal clicked:", goalId);
            editGoal(goalId);
          }
        }

        // Handle delete goal button clicks
        if (event.target.closest(".delete-goal-btn")) {
          const button = event.target.closest(".delete-goal-btn");
          const goalId = button.dataset.goalId;

          if (goalId) {
            console.log("Delete goal clicked:", goalId);
            deleteGoal(goalId);
          }
        }
      });

      console.log("Goal event delegation set up successfully");
    } else {
      console.warn("Goals container not found for event delegation");
    }
  }

  // Initialize goals page when DOM is ready
  document.addEventListener("DOMContentLoaded", async function () {
    try {
      await initGoalsPage();
    } catch (error) {
      console.error("Error initializing goals page:", error);

      // Show error state
      const container = document.getElementById("goalsContainer");
      if (container) {
        showEmptyState("goalsContainer", {
          icon: "⚠️",
          title: "Initialization Error",
          message:
            "Unable to load the goals page. Please refresh and try again.",
          actionText: "Refresh Page",
          onAction: () => {
            window.location.reload();
          },
        });
      }

      if (typeof showToast === "function") {
        showToast("Error loading page. Please try refreshing.", "error");
      }
    }
  });

  // Listen for authentication state changes
  window.addEventListener("authStateChanged", async (event) => {
    const { user, userData } = event.detail;

    if (user && userData) {
      console.log("Authentication state changed - user logged in");

      // If page was in unauthenticated state, reinitialize
      const container = document.getElementById("goalsContainer");
      if (
        container &&
        container.innerHTML.includes("Authentication Required")
      ) {
        console.log("Reinitializing goals page after authentication");
        await initGoalsPage();
      }
    } else {
      console.log("Authentication state changed - user logged out");

      // Show authentication required state
      const container = document.getElementById("goalsContainer");
      if (container) {
        showEmptyState("goalsContainer", {
          icon: "🔒",
          title: "Authentication Required",
          message: "Please log in to view and manage your goals.",
          actionText: "Go to Login",
          onAction: () => {
            window.location.href = "index.html";
          },
        });
      }
    }
  });

  // Export the filtering function for potential external use
  window.filterGoalsData = filterGoalsData;

  // Export the renderGoals function for use by modals
  window.renderGoals = renderGoals;

  // Export the refreshGoalsData function for use by modals
  window.refreshGoalsData = refreshGoalsData;

  // Export goal action functions for backward compatibility
  window.deleteGoal = deleteGoal;
  window.editGoal = editGoal;
})();
