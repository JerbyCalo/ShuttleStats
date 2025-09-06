// ShuttleStats v2 - Modal System
console.log("modals.js loaded");

// Import Firebase functions for Modal operations
import {
  db,
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "../config/firebase-config.js";

// Import authentication utilities
import { checkAuthenticationState } from "./auth-utils.js";

(function () {
  // Data cleaning functions for Firestore
  function cleanScheduleData(rawData) {
    // Clean each field, converting undefined to empty string or null for Firestore
    const cleanField = (value) => {
      if (value === undefined || value === null) return "";
      return String(value).trim();
    };

    return {
      title: cleanField(rawData.title),
      date: cleanField(rawData.date),
      time: cleanField(rawData.time),
      type: cleanField(rawData.type),
      location: cleanField(rawData.location),
      notes: cleanField(rawData.notes),
      createdAt: rawData.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }
  // Modal management functions
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById("modal-backdrop");

    if (modal && backdrop) {
      modal.style.display = "block";
      backdrop.style.display = "block";

      // Trigger animation
      setTimeout(() => {
        backdrop.classList.add("active");
        modal.classList.add("active");
      }, 10);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      console.log(`Modal ${modalId} opened`);
    }
  }

  function closeModal() {
    const openModal = document.querySelector(".modal.active");
    const backdrop = document.getElementById("modal-backdrop");

    if (openModal && backdrop) {
      // Remove active classes
      backdrop.classList.remove("active");
      openModal.classList.remove("active");

      // Hide elements after animation
      setTimeout(() => {
        openModal.style.display = "none";
        backdrop.style.display = "none";

        // Restore body scroll
        document.body.style.overflow = "";
      }, 300);

      console.log("Modal closed");
    }
  }

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

  // Specific modal functions
  window.openLogTrainingModal = function () {
    // Reset modal state for new session (only if not in edit mode)
    if (!window.editingSessionId) {
      window.editingSessionId = null;

      // Reset modal title and button text for create mode
      setTimeout(() => {
        const modalTitle = document.querySelector(
          "#logTrainingModal .modal-header h3"
        );
        if (modalTitle) {
          modalTitle.textContent = "Log Training Session";
        }

        const submitBtn = document.querySelector(
          "#logTrainingForm .btn-submit"
        );
        if (submitBtn) {
          submitBtn.textContent = "Log Session";
        }
      }, 10);
    }

    openModal("logTrainingModal");
  };

  window.openRecordMatchModal = function () {
    // Reset modal state for new match (only if not in edit mode)
    if (!window.editingMatchId) {
      window.editingMatchId = null;

      // Reset modal title and button text for create mode
      setTimeout(() => {
        const modalTitle = document.querySelector(
          "#recordMatchModal .modal-header h3"
        );
        if (modalTitle) {
          modalTitle.textContent = "Record Match";
        }

        const submitBtn = document.querySelector(
          "#recordMatchForm .btn-submit"
        );
        if (submitBtn) {
          submitBtn.textContent = "Record Match";
        }
      }, 10);
    }

    openModal("recordMatchModal");
  };

  window.openSetGoalModal = function () {
    // Reset modal state for new goal (only if not in edit mode)
    if (!window.editingGoalId) {
      window.editingGoalId = null;

      // Reset modal title and button text for create mode
      setTimeout(() => {
        const modalTitle = document.querySelector(
          "#setGoalModal .modal-header h3"
        );
        if (modalTitle) {
          modalTitle.textContent = "Set New Goal";
        }

        const submitBtn = document.querySelector("#setGoalForm .btn-submit");
        if (submitBtn) {
          submitBtn.textContent = "Set Goal";
        }
      }, 10);
    }

    openModal("setGoalModal");
  };

  window.openAddEventModal = function () {
    // Reset modal state for new event (only if not in edit mode)
    if (!window.editingEventId) {
      window.editingEventId = null;

      // Reset modal title and button text for create mode
      setTimeout(() => {
        const modalTitle = document.querySelector(
          "#addEventModal .modal-header h3"
        );
        if (modalTitle) {
          modalTitle.textContent = "Add New Event";
        }

        const submitBtn = document.querySelector("#addEventForm .btn-submit");
        if (submitBtn) {
          submitBtn.textContent = "Add Event";
        }
      }, 10);
    }

    openModal("addEventModal");
  };

  window.closeModal = closeModal;

  // Form submission handlers
  async function handleTrainingSubmit(event) {
    event.preventDefault();

    if (!window.currentUser) {
      if (typeof showToast === "function") {
        showToast(
          "Error: You must be logged in to log training sessions.",
          "error"
        );
      } else {
        alert("Error: You must be logged in to log training sessions.");
      }
      return;
    }

    const formData = new FormData(event.target);

    // Determine correct user IDs based on role
    let coachId, playerId;
    const currentUserId = window.currentUser.uid;
    const userRole = window.currentUserData?.role || "player";

    if (userRole === "coach") {
      // Coach creating training for a player
      coachId = currentUserId;
      // TODO: Get playerId from a player selection dropdown if in coach mode
      // For now, assume coach is creating for themselves or a specific player
      playerId = formData.get("selectedPlayerId") || currentUserId;
    } else {
      // Player creating training for themselves
      playerId = currentUserId;
      coachId = window.currentUserData?.coachId || null;
    }

    const data = {
      playerId: playerId,
      coachId: coachId,
      date: formData.get("trainingDate"),
      duration: parseInt(formData.get("trainingDuration")),
      type: formData.get("trainingType"),
      intensity: formData.get("trainingIntensity"),
      location: formData.get("trainingLocation"),
      coachComments: formData.get("trainingNotes") || "",
      exercises: [], // Default empty array for new sessions
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Show loading state in the submit button
    const submitBtn = event.target.querySelector(".btn-submit");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    try {
      if (window.editingSessionId) {
        // Edit mode - update existing session in Firestore
        await updateDoc(doc(db, "training", window.editingSessionId), {
          date: data.date,
          duration: data.duration,
          type: data.type,
          intensity: data.intensity,
          location: data.location,
          coachComments: data.coachComments,
          exercises: data.exercises,
          updatedAt: new Date(),
        });

        console.log(
          "Training session updated in Firestore:",
          window.editingSessionId
        );
        showSuccessMessage("Training session updated successfully!");

        // Clear edit mode
        window.editingSessionId = null;
      } else {
        // Create mode - add new session to Firestore
        const docRef = await addDoc(collection(db, "training"), data);

        console.log("Training session logged to Firestore:", docRef.id);
        showSuccessMessage("Training session logged successfully!");
      }

      // Re-fetch data using the centralized function
      if (typeof window.loadTrainingSessions === "function") {
        await window.loadTrainingSessions();
      } else if (window.location.pathname.includes("training.html")) {
        // Trigger a page refresh if training page functions aren't available
        window.location.reload();
      }

      closeModal();

      // Reset form
      event.target.reset();
    } catch (error) {
      console.error("Error saving training session:", error);

      let errorMessage = "Unable to save training session. Please try again.";
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to save training sessions.";
      } else if (error.code === "unavailable") {
        errorMessage =
          "Service temporarily unavailable. Please try again later.";
      }

      // Use proper error toast instead of success message
      if (typeof showToast === "function") {
        showToast(`Error: ${errorMessage}`, "error");
      } else {
        // Fallback for when toast.js is not loaded
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      // Restore submit button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async function handleMatchSubmit(event) {
    event.preventDefault();

    if (!window.currentUser) {
      if (typeof showToast === "function") {
        showToast("Error: You must be logged in to record matches.", "error");
      } else {
        alert("Error: You must be logged in to record matches.");
      }
      return;
    }

    const formData = new FormData(event.target);

    // Determine correct user IDs based on role
    let coachId, playerId;
    const currentUserId = window.currentUser.uid;
    const userRole = window.currentUserData?.role || "player";

    if (userRole === "coach") {
      // Coach creating match for a player
      coachId = currentUserId;
      // TODO: Get playerId from a player selection dropdown if in coach mode
      // For now, assume coach is creating for themselves or a specific player
      playerId = formData.get("selectedPlayerId") || currentUserId;
    } else {
      // Player creating match for themselves
      playerId = currentUserId;
      coachId = window.currentUserData?.coachId || null;
    }

    const rawData = {
      playerId: playerId,
      coachId: coachId,
      date: formData.get("matchDate"),
      opponent: formData.get("matchOpponent"),
      matchType: formData.get("matchType"),
      result: formData.get("matchResult"),
      yourScore: parseInt(formData.get("yourScore")),
      opponentScore: parseInt(formData.get("opponentScore")),
      yourScore2: formData.get("yourScore2")
        ? parseInt(formData.get("yourScore2"))
        : undefined,
      opponentScore2: formData.get("opponentScore2")
        ? parseInt(formData.get("opponentScore2"))
        : undefined,
      yourScore3: formData.get("yourScore3")
        ? parseInt(formData.get("yourScore3"))
        : undefined,
      opponentScore3: formData.get("opponentScore3")
        ? parseInt(formData.get("opponentScore3"))
        : undefined,
      duration: formData.get("matchDuration")
        ? parseInt(formData.get("matchDuration"))
        : undefined,
      notes: formData.get("matchNotes") || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Clean the data before saving to Firestore
    const data = Object.fromEntries(
      Object.entries(rawData).map(([key, value]) => {
        // Convert undefined or empty strings to null
        if (value === undefined || value === "") {
          return [key, null];
        }
        // Handle NaN values for number fields
        if (typeof value === "number" && isNaN(value)) {
          return [key, null];
        }
        return [key, value];
      })
    );

    // Show loading state in the submit button
    const submitBtn = event.target.querySelector(".btn-submit");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    try {
      if (window.editingMatchId) {
        // Edit mode - update existing match in Firestore
        // Clean the update data as well
        const updateData = {
          date: data.date,
          opponent: data.opponent,
          matchType: data.matchType,
          result: data.result,
          yourScore: data.yourScore,
          opponentScore: data.opponentScore,
          yourScore2: data.yourScore2,
          opponentScore2: data.opponentScore2,
          yourScore3: data.yourScore3,
          opponentScore3: data.opponentScore3,
          duration: data.duration,
          notes: data.notes,
          updatedAt: new Date(),
        };

        await updateDoc(doc(db, "matches", window.editingMatchId), updateData);

        console.log("Match updated in Firestore:", window.editingMatchId);
        showSuccessMessage("Match updated successfully!");

        // Clear edit mode
        window.editingMatchId = null;
      } else {
        // Create mode - add new match to Firestore
        const docRef = await addDoc(collection(db, "matches"), data);

        console.log("Match recorded to Firestore:", docRef.id);
        showSuccessMessage("Match recorded successfully!");
      }

      // Re-fetch data using the centralized function
      if (typeof window.loadMatches === "function") {
        await window.loadMatches();
      } else if (window.location.pathname.includes("matches.html")) {
        // Trigger a page refresh if matches page functions aren't available
        window.location.reload();
      }

      closeModal();

      // Reset form
      event.target.reset();
    } catch (error) {
      console.error("Error saving match:", error);

      let errorMessage = "Unable to save match. Please try again.";
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to save matches.";
      } else if (error.code === "unavailable") {
        errorMessage =
          "Service temporarily unavailable. Please try again later.";
      }

      // Use proper error toast instead of success message
      if (typeof showToast === "function") {
        showToast(`Error: ${errorMessage}`, "error");
      } else {
        // Fallback for when toast.js is not loaded
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      // Restore submit button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async function handleGoalSubmit(event) {
    event.preventDefault();

    console.log("=== GOAL SUBMIT HANDLER ===");
    console.log(
      "Edit mode check - window.editingGoalId:",
      window.editingGoalId
    );

    if (!window.currentUser) {
      if (typeof showToast === "function") {
        showToast("Error: You must be logged in to manage goals.", "error");
      } else {
        alert("Error: You must be logged in to manage goals.");
      }
      return;
    }

    const formData = new FormData(event.target);

    // Determine correct user IDs based on role
    let coachId, playerId;
    const currentUserId = window.currentUser.uid;
    const userRole = window.currentUserData?.role || "player";

    if (userRole === "coach") {
      // Coach creating goal for a player
      coachId = currentUserId;
      // TODO: Get playerId from a player selection dropdown if in coach mode
      // For now, assume coach is creating for themselves or a specific player
      playerId = formData.get("selectedPlayerId") || currentUserId;
    } else {
      // Player creating goal for themselves
      playerId = currentUserId;
      coachId = window.currentUserData?.coachId || null;
    }

    // Clean and validate data to prevent undefined values
    const cleanedData = {
      playerId: playerId,
      coachId: coachId,
      title: formData.get("goalTitle")?.trim() || "",
      description: formData.get("goalDescription")?.trim() || "",
      category: formData.get("goalCategory") || "Technical",
      priority: formData.get("goalPriority") || "Medium",
      status: formData.get("goalStatus") || "Not Started",
      targetDate: formData.get("goalTargetDate") || "",
      progress: parseInt(formData.get("goalProgress")) || 0,
      notes: formData.get("goalNotes")?.trim() || "",
      updatedAt: new Date(),
    };

    console.log("Cleaned data:", cleanedData);

    // Additional data validation
    if (!cleanedData.title) {
      if (typeof showToast === "function") {
        showToast("Goal title is required.", "error");
      } else {
        alert("Goal title is required.");
      }
      return;
    }

    if (!cleanedData.targetDate) {
      if (typeof showToast === "function") {
        showToast("Target date is required.", "error");
      } else {
        alert("Target date is required.");
      }
      return;
    }

    // Ensure progress is within valid range
    if (cleanedData.progress < 0 || cleanedData.progress > 100) {
      cleanedData.progress = Math.max(0, Math.min(100, cleanedData.progress));
    }

    // Show loading state in the submit button
    const submitBtn = event.target.querySelector(".btn-submit");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    try {
      if (window.editingGoalId) {
        console.log("=== EDIT MODE DETECTED ===");
        console.log("Updating goal with ID:", window.editingGoalId);

        // Edit mode - update existing goal in Firestore
        await updateDoc(doc(db, "goals", window.editingGoalId), cleanedData);

        console.log("Goal updated successfully:", window.editingGoalId);
        showSuccessMessage("Goal updated successfully!");

        // Clear edit mode
        window.editingGoalId = null;
        console.log("Edit mode cleared");
      } else {
        console.log("=== CREATE MODE DETECTED ===");

        // Create mode - add new goal to Firestore
        cleanedData.createdAt = new Date();

        const docRef = await addDoc(collection(db, "goals"), cleanedData);
        console.log("Goal created successfully:", docRef.id);
        showSuccessMessage("Goal set successfully!");
      }

      // Re-render the goals page if we're on it
      if (typeof renderGoals === "function") {
        console.log("Calling renderGoals to refresh data");
        await renderGoals();
      } else if (typeof refreshGoalsData === "function") {
        console.log("Calling refreshGoalsData to refresh data");
        await refreshGoalsData();
      } else if (window.location.pathname.includes("goals.html")) {
        // Trigger a page refresh if goals page functions aren't available
        console.log("Refreshing page to update data");
        window.location.reload();
      }

      closeModal();
      event.target.reset();
    } catch (error) {
      console.error("Goal submit error:", error);

      // Restore button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      let errorMessage = "Unable to save goal. Please try again.";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to perform this action.";
      } else if (error.code === "network-request-failed") {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message.includes("requires an index")) {
        errorMessage =
          "Database is being set up. Please try again in a few minutes.";
      }

      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  }

  async function handleEventSubmit(event) {
    event.preventDefault();

    // Check authentication first
    const authState = await checkAuthenticationState();
    if (!authState.authenticated) {
      if (typeof showToast === "function") {
        showToast("You must be logged in to manage events.", "error");
      } else {
        alert("You must be logged in to manage events.");
      }
      return;
    }

    const formData = new FormData(event.target);
    const rawData = {
      title: formData.get("eventTitle"),
      date: formData.get("eventDate"),
      time: formData.get("eventTime"),
      type: formData.get("eventType"),
      location: formData.get("eventLocation"),
      notes: formData.get("eventNotes"),
    };

    // Clean the data for Firestore
    const cleanData = cleanScheduleData(rawData);

    // Add user context - Use userId field instead of participants array
    cleanData.userId = authState.user.uid; // Single user ID field
    cleanData.userRole = authState.userData?.role || "player";
    cleanData.createdBy = authState.user.uid; // CRITICAL: Add createdBy field for queries    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = window.editingEventId
        ? "Updating..."
        : "Adding...";
    }

    try {
      if (window.editingEventId) {
        // Edit mode - update existing event in Firestore
        const eventRef = doc(db, "schedule", window.editingEventId);

        // Don't update createdAt, but update updatedAt
        delete cleanData.createdAt;

        await updateDoc(eventRef, cleanData);

        console.log("Event updated in Firestore:", window.editingEventId);
        showSuccessMessage("Event updated successfully!");

        // Clear edit mode
        window.editingEventId = null;
      } else {
        // Create mode - add new event to Firestore
        const docRef = await addDoc(collection(db, "schedule"), cleanData);

        console.log("Event added to Firestore:", docRef.id);
        showSuccessMessage("Event added successfully!");
      }

      // Re-render the schedule page if we're on it
      if (typeof renderScheduleEvents === "function") {
        await renderScheduleEvents();
      } else if (window.location.pathname.includes("schedule.html")) {
        // Trigger a page refresh if schedule page functions aren't available
        window.location.reload();
      }

      // Also refresh calendar if available
      if (typeof renderCalendar === "function") {
        renderCalendar();
      }

      // Close modal and reset form
      closeModal();
      event.target.reset();
    } catch (error) {
      console.error("Event submission error:", error);

      let errorMessage = "Unable to save event. Please try again.";
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to manage events.";
      } else if (error.code === "network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }

      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      // Restore button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  // Initialize modal system when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    // Set up backdrop click to close
    const backdrop = document.getElementById("modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", closeModal);
    }

    // Set up close button clicks
    document.querySelectorAll(".modal-close").forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    // Set up form submissions
    const trainingForm = document.getElementById("logTrainingForm");
    if (trainingForm) {
      trainingForm.addEventListener("submit", handleTrainingSubmit);
    }

    const matchForm = document.getElementById("recordMatchForm");
    if (matchForm) {
      matchForm.addEventListener("submit", handleMatchSubmit);
    }

    const goalForm = document.getElementById("setGoalForm");
    if (goalForm) {
      goalForm.addEventListener("submit", handleGoalSubmit);
    }

    const eventForm = document.getElementById("addEventForm");
    if (eventForm) {
      eventForm.addEventListener("submit", handleEventSubmit);
    }

    // Set up escape key to close modal
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeModal();
      }
    });

    console.log("Modal system initialized");
  });
})();
