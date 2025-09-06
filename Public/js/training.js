// ShuttleStats v2 - Training Page Logic
console.log("training.js loaded");

// Import Firebase functions for Training Sessions
import {
  db,
  auth,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
} from "../config/firebase-config.js";

// Import authentication utilities for better role detection
import { checkAuthenticationState } from "./auth-utils.js";

(function () {
  // Track if we're in coach mode
  let isCoachMode = false;
  let currentFilteredData = [];
  let trainingListener = null; // For real-time updates

  // Format date to readable string
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  // Get intensity badge class
  function getIntensityClass(intensity) {
    switch (intensity.toLowerCase()) {
      case "high":
        return "intensity-high";
      case "medium":
        return "intensity-medium";
      case "low":
        return "intensity-low";
      default:
        return "intensity-medium";
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

  // Create training session card
  async function createTrainingCard(session) {
    const card = document.createElement("div");
    card.className = "training-card";
    card.dataset.sessionId = session.id;

    // For coach mode, add player name to the header
    let playerInfo = "";
    if (isCoachMode) {
      const playerName = await getPlayerName(session.playerId);
      playerInfo = `<div class="player-info" style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;">
        👤 ${playerName}
       </div>`;
    }

    card.innerHTML = `
      ${playerInfo}
      <div class="training-card-header">
        <div class="training-date">
          <div class="date-main">${formatDate(session.date)}</div>
          <div class="date-sub">${session.duration} minutes</div>
        </div>
        <div class="training-type">
          <span class="type-badge">${session.type}</span>
          <span class="intensity-badge ${getIntensityClass(
            session.intensity
          )}">${session.intensity}</span>
        </div>
      </div>
      
      <div class="training-card-content">
        <div class="training-location">
          <span class="location-icon">📍</span>
          <span>${session.location}</span>
        </div>
        
        <div class="training-exercises">
          <strong>Exercises:</strong>
          <div class="exercise-list">
            ${session.exercises
              .map(
                (exercise) => `<span class="exercise-tag">${exercise}</span>`
              )
              .join("")}
          </div>
        </div>
        
        <div class="coach-comments">
          <strong>Coach Notes:</strong>
          <p class="comment-text">${session.coachComments}</p>
        </div>
      </div>
      
      <div class="training-card-actions">
        <button class="action-btn edit-btn" data-action="edit" data-session-id="${
          session.id
        }" title="Edit Session">
          <span class="btn-icon">✏️</span>
          <span class="btn-text">Edit</span>
        </button>
        <button class="action-btn delete-btn" data-action="delete" data-session-id="${
          session.id
        }" title="Delete Session">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Delete</span>
        </button>
      </div>
    `;

    return card;
  }

  // Fetch training sessions from Firestore (Player View)
  async function fetchPlayerTrainingSessions(userId) {
    if (!userId) {
      console.warn("No user ID provided for fetching training sessions");
      return [];
    }

    try {
      const q = query(
        collection(db, "training"),
        where("playerId", "==", userId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(
        `Fetched ${sessions.length} training sessions for player ${userId}`
      );
      return sessions;
    } catch (error) {
      console.error("Error fetching training sessions:", error);
      throw error;
    }
  }

  // Fetch training sessions from Firestore (Coach View)
  async function fetchCoachTrainingSessions(coachId, playerId = null) {
    if (!coachId) {
      console.warn("No coach ID provided for fetching training sessions");
      return [];
    }

    try {
      let q;
      if (playerId && playerId !== "") {
        // Filter by specific player (no more "all" option)
        q = query(
          collection(db, "training"),
          where("coachId", "==", coachId),
          where("playerId", "==", playerId),
          orderBy("date", "desc")
        );
      } else {
        // If no specific player is provided, return empty array
        console.log("No player selected, returning empty array");
        return [];
      }

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(
        `Fetched ${sessions.length} training sessions for coach ${coachId} (player: ${playerId})`
      );
      return sessions;
    } catch (error) {
      console.error("Error fetching coach training sessions:", error);
      throw error;
    }
  }

  // Filter training data by player ID (for coach mode) - Updated to use Firestore data
  async function filterTrainingData(playerId) {
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (!currentUserId) {
      console.warn("No authenticated user for filtering training data");
      return [];
    }

    try {
      if (isCoachMode) {
        // Coach mode: fetch from Firestore
        return await fetchCoachTrainingSessions(currentUserId, playerId);
      } else {
        // Player mode: fetch user's own sessions
        return await fetchPlayerTrainingSessions(currentUserId);
      }
    } catch (error) {
      console.error("Error filtering training data:", error);
      return [];
    }
  }

  // Update training statistics (works with Firestore data)
  function updateTrainingStats(dataToUse = []) {
    const totalSessionsEl = document.getElementById("totalSessions");
    const totalHoursEl = document.getElementById("totalHours");

    if (!dataToUse || dataToUse.length === 0) {
      if (totalSessionsEl) totalSessionsEl.textContent = "0";
      if (totalHoursEl) totalHoursEl.textContent = "0";
      return;
    }

    const totalSessions = dataToUse.length;
    const totalMinutes = dataToUse.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

    if (totalSessionsEl) totalSessionsEl.textContent = totalSessions;
    if (totalHoursEl) totalHoursEl.textContent = totalHours;

    console.log(
      `Stats updated: ${totalSessions} sessions, ${totalHours} hours`
    );
  }

  // Render training sessions (works with Firestore data)
  async function renderTrainingSessions(sessionsData = null) {
    const container = document.getElementById("trainingSessionsContainer");

    if (!container) {
      console.error("Training sessions container not found");
      return;
    }

    // Show loading spinner
    showLocalLoader("trainingSessionsContainer", {
      text: "Loading training sessions...",
      size: "normal",
    });

    try {
      let dataToRender;

      if (sessionsData !== null) {
        // Use provided data
        dataToRender = sessionsData;
      } else {
        // Fetch data based on user role and authentication
        const currentUserId = sessionStorage.getItem("currentUserId");
        if (!currentUserId) {
          throw new Error("User not authenticated");
        }

        if (isCoachMode) {
          // Coach mode: use current filtered data or fetch all
          const dropdown = document.getElementById("playerFilterDropdown");
          const selectedPlayerId = dropdown ? dropdown.value : "all";
          dataToRender = await fetchCoachTrainingSessions(
            currentUserId,
            selectedPlayerId === "" ? "all" : selectedPlayerId
          );
        } else {
          // Player mode: fetch user's own sessions
          dataToRender = await fetchPlayerTrainingSessions(currentUserId);
        }
      }

      // Clear existing content after loading
      container.innerHTML = "";

      // Hide loading spinner
      hideLoadingSpinner("trainingSessionsContainer");

      // Check if we have training data
      if (!dataToRender || dataToRender.length === 0) {
        const emptyMessage = isCoachMode
          ? "No training sessions found for the selected player."
          : "No training sessions yet. Start logging your training sessions to see them here.";

        showEmptyState("trainingSessionsContainer", {
          icon: "🏸",
          title: "No Training Sessions",
          message: emptyMessage,
          actionText: "+ Add Training Session",
          onAction: () => {
            if (window.openLogTrainingModal) {
              window.openLogTrainingModal();
            }
          },
        });

        updateTrainingStats(dataToRender);
        return;
      }

      // Sort sessions by date (newest first) - data should already be sorted from Firestore
      const sortedSessions = [...dataToRender];

      // Create and append training cards (now async)
      for (const session of sortedSessions) {
        const card = await createTrainingCard(session);
        container.appendChild(card);
      }

      // Update statistics
      updateTrainingStats(dataToRender);

      console.log(`Rendered ${sortedSessions.length} training sessions`);
    } catch (error) {
      console.error("Error rendering training sessions:", error);
      hideLoadingSpinner("trainingSessionsContainer");

      showEmptyState("trainingSessionsContainer", {
        icon: "⚠️",
        title: "Error Loading Sessions",
        message:
          error.message === "User not authenticated"
            ? "Please log in to view your training sessions."
            : "Unable to load training sessions. Please try refreshing the page.",
      });
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

    console.log("=== DEBUG: Creating player filter dropdown ===");
    console.log("Current coach user ID:", currentUserId);

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

      console.log("=== DEBUG: Querying for coach's players ===");
      const querySnapshot = await getDocs(coachPlayersQuery);
      console.log("Found", querySnapshot.size, "player relationships");

      if (querySnapshot.empty) {
        console.log("=== DEBUG: No player relationships found ===");
        console.log("This could mean:");
        console.log("1. Coach has no players assigned");
        console.log("2. Incorrect coachId in query");
        console.log("3. Players haven't accepted invitations yet");

        // Show "No Players" message
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No Players Found";
        dropdown.appendChild(option);
        return;
      }

      // Collect players data
      const players = [];
      for (const docSnapshot of querySnapshot.docs) {
        const relationship = docSnapshot.data();
        console.log("=== DEBUG: Processing player relationship ===");
        console.log("Relationship data:", relationship);

        try {
          if (!relationship.playerId) {
            console.warn("Player relationship missing playerId:", relationship);
            continue;
          }

          // Fetch player details
          const playerDoc = await getDoc(
            doc(db, "users", relationship.playerId)
          );

          console.log("Player document exists:", playerDoc.exists());

          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            console.log("Player data:", playerData);

            if (
              !playerData.name ||
              !playerData.name.first ||
              !playerData.name.last
            ) {
              console.warn("Player missing name data:", playerData);
              continue;
            }

            players.push({
              id: relationship.playerId,
              name: `${playerData.name.first} ${playerData.name.last}`.trim(),
            });

            console.log(
              `Added player: ${players[players.length - 1].name} (${
                players[players.length - 1].id
              })`
            );
          } else {
            console.warn(
              `Player document not found for ID: ${relationship.playerId}`
            );
          }
        } catch (error) {
          console.error("Error fetching player details:", error);
        }
      }

      console.log(`=== DEBUG: Total players collected: ${players.length} ===`);

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
          await window.loadTrainingSessions();
        }, 100);
      }

      // Add event listener for filtering
      dropdown.addEventListener("change", async function () {
        const selectedPlayerId = this.value;
        console.log(`Filtering training data for player: ${selectedPlayerId}`);

        // Use the centralized function to reload data
        await window.loadTrainingSessions();
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
      pageTitle.textContent = "Manage Training";
    }

    // Update subheading
    const subheading = document.querySelector(".page-title .subheading");
    if (subheading) {
      subheading.textContent = "Manage training sessions for all players";
    }

    // Create and inject player filter dropdown
    createPlayerFilterDropdown();

    console.log("Coach mode UI setup complete");
  }

  // Set up event delegation for edit and delete buttons
  function setupEventDelegation() {
    const trainingContainer = document.getElementById(
      "trainingSessionsContainer"
    );

    if (trainingContainer) {
      trainingContainer.addEventListener("click", function (event) {
        const target = event.target;
        let button = null;

        // Check if clicked element is a button or a child of a button
        if (target.classList.contains("action-btn")) {
          button = target;
        } else if (target.closest(".action-btn")) {
          button = target.closest(".action-btn");
        }

        if (button) {
          const action = button.dataset.action;
          const sessionId = button.dataset.sessionId;

          if (action === "edit" && sessionId) {
            console.log("Edit button clicked for session:", sessionId);
            window.editTrainingSession(sessionId);
          } else if (action === "delete" && sessionId) {
            console.log("Delete button clicked for session:", sessionId);
            window.deleteTrainingSession(sessionId);
          }
        }
      });

      console.log("Event delegation set up for training card actions");
    } else {
      console.warn(
        "Training sessions container not found for event delegation"
      );
    }
  }

  // Set up "Add New Training" button
  function setupAddTrainingButton() {
    const addButton = document.getElementById("addTrainingBtn");

    if (addButton) {
      addButton.addEventListener("click", function () {
        console.log("Opening training modal");

        // Check if modal function exists (from modals.js)
        if (window.openLogTrainingModal) {
          window.openLogTrainingModal();
        } else {
          console.warn("Training modal function not available");
          alert("Training modal will be available when modals.js is loaded");
        }
      });

      console.log("Add training button set up");
    } else {
      console.warn("Add training button not found");
    }
  }

  // Delete training session from Firestore
  window.deleteTrainingSession = async function (sessionId) {
    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to delete this training session? This action cannot be undone."
      )
    ) {
      return;
    }

    const currentUserId = sessionStorage.getItem("currentUserId");
    if (!currentUserId) {
      alert("Error: You must be logged in to delete training sessions.");
      return;
    }

    // Find the session card and show loading state
    const sessionCard = document.querySelector(
      `[data-session-id="${sessionId}"]`
    );
    if (sessionCard) {
      showLocalLoader(sessionCard.id || "session-card", {
        text: "Deleting session...",
        size: "small",
      });
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "training", sessionId));

      console.log("Training session deleted from Firestore:", sessionId);

      // Re-render the sessions list using the centralized function
      await window.loadTrainingSessions();

      // Show success message
      showSuccessMessage("Training session deleted successfully!");
    } catch (error) {
      console.error("Session deletion error:", error);
      if (sessionCard) {
        hideLoadingSpinner(sessionCard.id || "session-card");
      }

      // Show specific error messages based on the error type
      let errorMessage = "Unable to delete training session. Please try again.";
      if (error.code === "permission-denied") {
        errorMessage =
          "You don't have permission to delete this training session.";
      } else if (error.code === "not-found") {
        errorMessage =
          "Training session not found. It may have already been deleted.";
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  // Edit training session
  window.editTrainingSession = async function (sessionId) {
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (!currentUserId) {
      alert("Error: You must be logged in to edit training sessions.");
      return;
    }

    try {
      // Fetch the session from Firestore to get the latest data
      const sessionDoc = await getDoc(doc(db, "training", sessionId));

      if (!sessionDoc.exists()) {
        console.error("Session not found for editing:", sessionId);
        alert("Error: Training session not found.");
        return;
      }

      const session = { id: sessionDoc.id, ...sessionDoc.data() };

      console.log("Opening edit modal for session:", session);

      // Check if modal function exists (from modals.js)
      if (window.openLogTrainingModal) {
        // Set flag to indicate edit mode
        window.editingSessionId = sessionId;

        // Open the modal
        window.openLogTrainingModal();

        // Pre-populate the form with existing data
        setTimeout(() => {
          populateEditForm(session);
        }, 100); // Small delay to ensure modal is open
      } else {
        console.warn("Training modal function not available");
        alert("Training modal will be available when modals.js is loaded");
      }
    } catch (error) {
      console.error("Error fetching session for edit:", error);
      alert("Error: Unable to load training session data for editing.");
    }
  };

  // Populate edit form with session data
  function populateEditForm(session) {
    const form = document.getElementById("logTrainingForm");
    if (!form) {
      console.error("Training form not found");
      return;
    }

    // Update modal title
    const modalTitle = document.querySelector(
      "#logTrainingModal .modal-header h3"
    );
    if (modalTitle) {
      modalTitle.textContent = "Edit Training Session";
    }

    // Update submit button text
    const submitBtn = form.querySelector(".btn-submit");
    if (submitBtn) {
      submitBtn.textContent = "Update Session";
    }

    // Populate form fields
    const fields = {
      trainingDate: session.date,
      trainingDuration: session.duration,
      trainingType: session.type,
      trainingIntensity: session.intensity,
      trainingLocation: session.location,
      trainingNotes: session.coachComments,
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.value = value || "";
      }
    });

    console.log("Form populated with session data");
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

  // Centralized function to load training sessions
  window.loadTrainingSessions = async function () {
    console.log("Loading training sessions...");

    const container = document.getElementById("trainingSessionsContainer");
    if (!container) {
      console.error("Training sessions container not found");
      return;
    }

    // Show loading spinner
    showLocalLoader("trainingSessionsContainer", {
      text: "Loading training sessions...",
      size: "normal",
    });

    try {
      const currentUserId = sessionStorage.getItem("currentUserId");
      if (!currentUserId) {
        throw new Error("User not authenticated");
      }

      let dataToRender;

      if (isCoachMode) {
        // Coach mode: use current filtered data or fetch all
        const dropdown = document.getElementById("playerFilterDropdown");
        const selectedPlayerId = dropdown ? dropdown.value : "";
        dataToRender = await fetchCoachTrainingSessions(
          currentUserId,
          selectedPlayerId
        );
      } else {
        // Player mode: fetch user's own sessions
        dataToRender = await fetchPlayerTrainingSessions(currentUserId);
      }

      // Clear existing content after loading
      container.innerHTML = "";

      // Hide loading spinner
      hideLoadingSpinner("trainingSessionsContainer");

      // Check if we have training data
      if (!dataToRender || dataToRender.length === 0) {
        const emptyMessage = isCoachMode ? "" : "";

        showEmptyState("trainingSessionsContainer", {
          icon: "🏸",
          title: "No Training Sessions",
          message: emptyMessage,
          actionText: "+ Add Training Session",
          onAction: () => {
            if (window.openLogTrainingModal) {
              window.openLogTrainingModal();
            }
          },
        });

        updateTrainingStats(dataToRender);
        return;
      }

      // Sort sessions by date (newest first) - data should already be sorted from Firestore
      const sortedSessions = [...dataToRender];

      // Create and append training cards (now async)
      for (const session of sortedSessions) {
        const card = await createTrainingCard(session);
        container.appendChild(card);
      }

      // Update statistics
      updateTrainingStats(dataToRender);

      console.log(
        `Loaded and rendered ${sortedSessions.length} training sessions`
      );
    } catch (error) {
      console.error("Error loading training sessions:", error);
      hideLoadingSpinner("trainingSessionsContainer");

      showEmptyState("trainingSessionsContainer", {
        icon: "⚠️",
        title: "Error Loading Sessions",
        message:
          error.message === "User not authenticated"
            ? "Please log in to view your training sessions."
            : "Unable to load training sessions. Please try refreshing the page.",
      });
    }
  };

  // Initialize training page when DOM is ready
  document.addEventListener("DOMContentLoaded", async function () {
    console.log("Training page initializing...");

    // Wait for user authentication from sessionStorage
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (!currentUserId) {
      console.log("User not authenticated, redirecting to login.");
      // Optional: show a message before redirecting
      // document.body.innerHTML = '<h1>Please log in to view this page. Redirecting...</h1>';
      window.location.href = "login.html";
    } else {
      await initializePage();
    }
  });

  // Set up real-time listener for training sessions (Stretch Goal)
  function setupRealtimeListener() {
    if (!window.currentUser || trainingListener) {
      return; // Already set up or no user
    }

    try {
      let q;
      if (isCoachMode) {
        // Coach mode: listen to all sessions for this coach
        q = query(
          collection(db, "training"),
          where("coachId", "==", window.currentUser.uid),
          orderBy("date", "desc")
        );
      } else {
        // Player mode: listen to user's own sessions
        q = query(
          collection(db, "training"),
          where("playerId", "==", window.currentUser.uid),
          orderBy("date", "desc")
        );
      }

      trainingListener = onSnapshot(
        q,
        (snapshot) => {
          console.log("Real-time update received for training sessions");

          const sessions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Filter for coach mode if needed
          let filteredSessions = sessions;
          if (isCoachMode) {
            const dropdown = document.getElementById("playerFilterDropdown");
            const selectedPlayerId = dropdown ? dropdown.value : "all";

            if (
              selectedPlayerId &&
              selectedPlayerId !== "" &&
              selectedPlayerId !== "all"
            ) {
              filteredSessions = sessions.filter(
                (session) => session.playerId === selectedPlayerId
              );
            }
          }

          // Re-render with updated data using the centralized function
          window.loadTrainingSessions();
        },
        (error) => {
          console.error("Error in real-time listener:", error);
        }
      );

      console.log("Real-time listener set up for training sessions");
    } catch (error) {
      console.error("Error setting up real-time listener:", error);
    }
  }

  // Clean up listener when leaving page
  function cleanupRealtimeListener() {
    if (trainingListener) {
      trainingListener();
      trainingListener = null;
      console.log("Real-time listener cleaned up");
    }
  }

  // Initialize page functionality
  async function initializePage() {
    // Set up event delegation for edit and delete buttons
    setupEventDelegation();

    // Check if user is a coach (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get("user");

    if (
      userRole === "coach" ||
      (window.currentUserData && window.currentUserData.role === "coach")
    ) {
      // Coach mode: Transform page for management view
      isCoachMode = true;
      console.log("Coach mode detected - setting up management interface");

      // Set up coach mode UI
      setupCoachMode();

      // Set up add training button (works in both modes)
      setupAddTrainingButton();
    } else {
      // Player mode: Normal functionality
      isCoachMode = false;
      console.log("Player mode - loading normal training page");

      // Load training sessions using the centralized function
      await window.loadTrainingSessions();

      // Set up add training button
      setupAddTrainingButton();
    }

    // Set up real-time listener (stretch goal)
    setupRealtimeListener();

    console.log("Training page initialized successfully");
  }

  // Clean up on page unload
  window.addEventListener("beforeunload", cleanupRealtimeListener);

  // Export the filtering function for potential external use
  window.filterTrainingData = filterTrainingData;
})();
