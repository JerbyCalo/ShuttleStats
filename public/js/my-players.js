// ShuttleStats v2 - My Players Page Logic
console.log("my-players.js loaded");

// Import Firebase functions for Player management operations
import {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "../config/firebase-config.js";

// Import authentication utilities
import { checkAuthenticationState } from "./auth-utils.js";

(function () {
  let selectedPlayerForRemoval = null;

  // Load and render the players list from Firestore
  async function loadPlayersList() {
    const playersContainer = document.getElementById("playersList");

    if (!playersContainer) {
      console.error("Players container not found");
      return;
    }

    // Show loading spinner
    showLocalLoader("playersList", {
      text: "Loading players...",
      size: "normal",
    });

    try {
      // Check authentication
      const authState = await checkAuthenticationState();
      if (!authState.authenticated) {
        hideLoadingSpinner("playersList");
        showEmptyState("playersList", {
          icon: "🔒",
          title: "Authentication Required",
          message: "Please log in to view your players.",
        });
        return;
      }

      // Clear existing content
      playersContainer.innerHTML = "";

      // Query coach-player relationships from Firestore (both pending and accepted)
      const relationshipsQuery = query(
        collection(db, "coach_players"),
        where("coachId", "==", authState.user.uid)
        // Remove status filter to show both pending and accepted relationships
      );

      const relationshipsSnapshot = await getDocs(relationshipsQuery);
      console.log(
        `Found ${relationshipsSnapshot.docs.length} player relationships`
      );

      if (relationshipsSnapshot.empty) {
        // Hide loading and show empty state
        hideLoadingSpinner("playersList");

        showEmptyState("playersList", {
          icon: "👥",
          title: "No Players Yet",
          message:
            "Start building your roster by adding your first player. You can invite them to join ShuttleStats and track their progress.",
          actionText: "Add Your First Player",
          actionHandler: () => openAddPlayerModal(),
        });

        updatePlayersStats(0, 0);
        return;
      }

      // Fetch player details for each relationship
      const playersData = [];
      for (const relationshipDoc of relationshipsSnapshot.docs) {
        const relationship = relationshipDoc.data();

        try {
          // For pending invitations, we might not have a playerId yet
          if (relationship.status === "pending" && !relationship.playerId) {
            // Show pending invitation without full player data
            playersData.push({
              id: `pending_${relationshipDoc.id}`, // Temporary ID
              name: relationship.playerName,
              email: relationship.playerEmail,
              avatar: relationship.playerName
                ? relationship.playerName[0].toUpperCase()
                : "?",
              team: "Pending",
              status: "Pending Invitation",
              relationshipId: relationshipDoc.id,
              joinedDate: relationship.invitedAt,
              isPending: true,
            });
          } else if (relationship.playerId) {
            // Get full player data from users collection
            const playerDoc = await getDoc(
              doc(db, "users", relationship.playerId)
            );
            if (playerDoc.exists()) {
              const playerData = playerDoc.data();
              playersData.push({
                id: playerDoc.id,
                name: `${playerData.name.first} ${playerData.name.last}`.trim(),
                email: playerData.email,
                avatar: getAvatarForUser(playerData),
                team: "General",
                status:
                  relationship.status === "accepted"
                    ? "Active"
                    : relationship.status,
                relationshipId: relationshipDoc.id,
                joinedDate: relationship.acceptedAt || relationship.invitedAt,
                isPending: relationship.status === "pending",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching player data:", error);
          // Still show the relationship even if we can't get full player details
          playersData.push({
            id: `error_${relationshipDoc.id}`,
            name: relationship.playerName || "Unknown Player",
            email: relationship.playerEmail || "unknown@email.com",
            avatar: "?",
            team: "Error",
            status: "Error Loading",
            relationshipId: relationshipDoc.id,
            joinedDate: relationship.invitedAt,
            isPending: false,
          });
        }
      }

      if (playersData.length === 0) {
        hideLoadingSpinner("playersList");
        showEmptyState("playersList", {
          icon: "⚠️",
          title: "No Player Data",
          message: "Unable to load player information. Please try again.",
          actionText: "Retry",
          actionHandler: () => loadPlayersList(),
        });
        return;
      }

      // Sort players by name
      playersData.sort((a, b) => a.name.localeCompare(b.name));

      // Count active players (only those with accepted status)
      const activePlayers = playersData.filter(
        (player) => player.status === "Active" && !player.isPending
      ).length;

      // Create and append player cards
      playersData.forEach((player) => {
        const card = createPlayerCard(player);
        playersContainer.appendChild(card);
      });

      // Update statistics
      updatePlayersStats(playersData.length, activePlayers);

      // Hide loading spinner
      hideLoadingSpinner("playersList");

      console.log(`Rendered ${playersData.length} players`);
    } catch (error) {
      console.error("Error loading players list:", error);
      hideLoadingSpinner("playersList");

      // Show error state
      showErrorState("playersList", {
        title: "Loading Error",
        message: "Failed to load players. Please try refreshing the page.",
        retry: () => loadPlayersList(),
      });
    }
  }

  // Create a player card element
  function createPlayerCard(player) {
    const card = document.createElement("div");
    card.className = "player-card";
    card.dataset.playerId = player.id;

    // Different styling for pending invitations
    if (player.isPending) {
      card.classList.add("pending-invitation");
    }

    const removeButton = player.isPending
      ? `<button class="btn-action btn-cancel" onclick="cancelInvitation('${player.relationshipId}', '${player.name}')" title="Cancel Invitation">
           <span>❌</span>
           Cancel
         </button>`
      : `<button class="btn-action btn-remove" onclick="openRemovePlayerModal('${player.id}', '${player.name}')" title="Remove Player">
           <span>🗑️</span>
           Remove
         </button>`;

    card.innerHTML = `
      <div class="player-header">
        <div class="player-info">
          <div class="player-avatar">${player.avatar}</div>
          <div class="player-details">
            <h3>${player.name}</h3>
            <p class="player-email">${player.email}</p>
          </div>
        </div>
        <div class="player-status ${player.status
          .toLowerCase()
          .replace(" ", "-")}">${player.status}</div>
      </div>
      
      <div class="player-team">${player.team}</div>
      
      <div class="player-actions">
        ${removeButton}
      </div>

      ${
        player.isPending
          ? `
        <style>
          .player-card.pending-invitation {
            border-left: 4px solid #f59e0b;
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          }
          .player-status.pending-invitation {
            background: #f59e0b;
            color: white;
          }
          .btn-cancel {
            background: #ef4444;
            color: white;
          }
          .btn-cancel:hover {
            background: #dc2626;
          }
        </style>
      `
          : ""
      }
    `;

    return card;
  }

  // Update players statistics
  function updatePlayersStats(total, active) {
    const totalElement = document.getElementById("totalPlayers");
    const activeElement = document.getElementById("activePlayers");

    if (totalElement) totalElement.textContent = total;
    if (activeElement) activeElement.textContent = active;
  }

  // Handle adding a new player - Create coach-player relationship
  async function handleAddPlayer(playerData) {
    console.log("=== STARTING ADD PLAYER DEBUG ===");
    console.log("1. Starting to add player:", playerData);

    // Show loading while adding player
    showLocalLoader("playersList", {
      text: "Adding player...",
      size: "small",
    });

    try {
      // Check authentication
      console.log("2. Checking authentication state...");
      const authState = await checkAuthenticationState();
      console.log("3. Authentication result:", {
        authenticated: authState.authenticated,
        userId: authState.user?.uid,
        userRole: authState.userData?.role,
      });

      if (!authState.authenticated) {
        console.error("4. Authentication failed - user not authenticated");
        hideLoadingSpinner("playersList");
        if (typeof showToast === "function") {
          showToast("Authentication required to add players.", "error");
        }
        return;
      }

      // Check if a relationship already exists with this email
      console.log(
        "5. Checking for existing relationship with email:",
        playerData.email.toLowerCase()
      );
      const existingRelationshipQuery = query(
        collection(db, "coach_players"),
        where("coachId", "==", authState.user.uid),
        where("playerEmail", "==", playerData.email.toLowerCase())
      );

      console.log("6. Executing existing relationship query...");
      const existingSnapshot = await getDocs(existingRelationshipQuery);
      console.log("7. Existing relationship query result:", {
        empty: existingSnapshot.empty,
        size: existingSnapshot.size,
      });

      if (!existingSnapshot.empty) {
        console.log("8. Player already exists in list - aborting");
        hideLoadingSpinner("playersList");
        if (typeof showToast === "function") {
          showToast(
            "A player with this email is already in your list.",
            "error"
          );
        }
        return;
      }

      // Check if the player user exists in the system
      console.log("9. Checking if player exists in users collection...");
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", playerData.email.toLowerCase())
      );
      console.log("10. Executing user query...");
      const userSnapshot = await getDocs(userQuery);
      console.log("11. User query result:", {
        empty: userSnapshot.empty,
        size: userSnapshot.size,
      });

      let playerId = null;
      let playerExists = false;

      if (!userSnapshot.empty) {
        const playerDoc = userSnapshot.docs[0];
        const playerUserData = playerDoc.data();
        console.log("12. Found user data:", {
          id: playerDoc.id,
          email: playerUserData.email,
          role: playerUserData.role,
          name: playerUserData.name,
        });

        // Check if user is a player
        if (playerUserData.role === "player") {
          playerId = playerDoc.id;
          playerExists = true;
          console.log(
            "13. User is a valid player, proceeding with ID:",
            playerId
          );
        } else {
          console.log(
            "14. User exists but is not a player, role:",
            playerUserData.role
          );
          hideLoadingSpinner("playersList");
          if (typeof showToast === "function") {
            showToast(
              "This email belongs to a coach account, not a player.",
              "error"
            );
          }
          return;
        }
      } else {
        console.log(
          "15. No user found with this email - will create pending relationship"
        );
      }

      // Create coach-player relationship - ALWAYS create as "pending"
      // The player must accept the invitation manually, even if they exist in the system
      const relationshipData = {
        coachId: authState.user.uid,
        coachEmail: authState.userData.email,
        playerEmail: playerData.email.toLowerCase(),
        playerName: playerData.name,
        status: "pending", // Always pending - player must accept invitation
        invitedAt: new Date(),
        acceptedAt: null,
        notes: "",
      };

      // If player exists, add their ID to the relationship, but still keep status as pending
      if (playerId) {
        relationshipData.playerId = playerId;
      }

      console.log(
        "16. Creating coach_players document with data:",
        relationshipData
      );
      console.log("17. Current user ID:", authState.user.uid);
      console.log("18. Target collection: coach_players");

      // 🔥 DEBUG: Coach Add Player Attempt - Critical values comparison
      console.log("🔥 DEBUG: Coach Add Player Attempt");
      console.log("Logged-in User UID (request.auth.uid):", authState.user.uid);
      console.log("Data being sent to Firestore:", {
        coachId: relationshipData.coachId,
        coachEmail: relationshipData.coachEmail,
        playerEmail: relationshipData.playerEmail,
        playerName: relationshipData.playerName,
        status: relationshipData.status,
        invitedAt: relationshipData.invitedAt,
        acceptedAt: relationshipData.acceptedAt,
        notes: relationshipData.notes,
        playerId: relationshipData.playerId, // May be null for pending invitations
      });
      console.log("🔥 DEBUG: UID Match Check:", {
        currentUserUid: authState.user.uid,
        coachIdInData: relationshipData.coachId,
        doTheyMatch: authState.user.uid === relationshipData.coachId,
      });

      try {
        console.log("19. Attempting to add document to Firestore...");

        // Create the relationship document
        const docRef = await addDoc(
          collection(db, "coach_players"),
          relationshipData
        );

        console.log(
          "20. SUCCESS! Coach-player relationship created with ID:",
          docRef.id
        );
      } catch (firestoreError) {
        console.error("21. FIRESTORE ADD DOCUMENT ERROR:");
        console.error("    - Error object:", firestoreError);
        console.error("    - Error code:", firestoreError.code);
        console.error("    - Error message:", firestoreError.message);
        console.error(
          "    - Full error details:",
          JSON.stringify(firestoreError, null, 2)
        );
        throw firestoreError; // Re-throw to be caught by outer try-catch
      }

      // DO NOT update the player's user document here
      // The users collection is only updated when the player accepts the invitation
      // This follows the API checklist specification

      console.log("25. Refreshing players list...");
      // Refresh the list
      await loadPlayersList();

      // Show invitation sent message
      const message = `Invitation sent to ${playerData.name} (${playerData.email}). They will see it on their dashboard and can accept it.`;

      console.log("26. SUCCESS - Add player operation completed:", message);
      showSuccessMessage(message);
    } catch (error) {
      console.error("=== ADD PLAYER ERROR DETAILS ===");
      console.error("Error object:", error);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      // Additional Firebase-specific error details
      if (error.code) {
        console.error("Firebase error code:", error.code);
        switch (error.code) {
          case "permission-denied":
            console.error("PERMISSION DENIED - Check Firestore rules");
            break;
          case "unauthenticated":
            console.error("UNAUTHENTICATED - User not logged in");
            break;
          case "invalid-argument":
            console.error("INVALID ARGUMENT - Check data structure");
            break;
          default:
            console.error("Unknown Firebase error code");
        }
      }

      hideLoadingSpinner("playersList");

      // Show error message
      const errorMessage =
        error.code === "permission-denied"
          ? "Permission denied. Please check your access rights."
          : "Failed to add player. Please try again.";

      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      } else {
        alert(errorMessage);
      }
    }
  }

  // Handle removing a player - Delete coach-player relationship
  async function handleRemovePlayer(playerId) {
    // Show loading while removing player
    showLocalLoader("playersList", {
      text: "Removing player...",
      size: "small",
    });

    try {
      // Check authentication
      const authState = await checkAuthenticationState();
      if (!authState.authenticated) {
        hideLoadingSpinner("playersList");
        if (typeof showToast === "function") {
          showToast("Authentication required to remove players.", "error");
        }
        return;
      }

      // Find the coach-player relationship to remove
      const relationshipQuery = query(
        collection(db, "coach_players"),
        where("coachId", "==", authState.user.uid),
        where("playerId", "==", playerId)
      );

      const relationshipSnapshot = await getDocs(relationshipQuery);

      if (relationshipSnapshot.empty) {
        hideLoadingSpinner("playersList");
        console.error("Coach-player relationship not found:", playerId);
        if (typeof showToast === "function") {
          showToast("Player relationship not found.", "error");
        }
        return;
      }

      // Get player name before deletion for success message
      const playerDoc = await getDoc(doc(db, "users", playerId));
      const playerName = playerDoc.exists()
        ? `${playerDoc.data().name.first} ${playerDoc.data().name.last}`.trim()
        : "Player";

      // Delete the relationship document
      const relationshipDoc = relationshipSnapshot.docs[0];
      await deleteDoc(relationshipDoc.ref);

      // Update the player's user document to remove coachId
      try {
        await updateDoc(doc(db, "users", playerId), {
          coachId: null,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.warn(
          "Could not update player's coachId (player may not exist):",
          error
        );
        // Continue with removal even if player update fails
      }

      console.log("Coach-player relationship removed:", relationshipDoc.id);

      // Refresh the list
      await loadPlayersList();

      // Show success message
      showSuccessMessage(
        `${playerName} has been removed from your player list.`
      );
    } catch (error) {
      console.error("Error removing player:", error);
      hideLoadingSpinner("playersList");

      // Show error message
      if (typeof showToast === "function") {
        showToast("Failed to remove player. Please try again.", "error");
      } else {
        alert("Failed to remove player. Please try again.");
      }
    }
  }

  // Handle canceling a pending invitation
  async function cancelInvitation(relationshipId, playerName) {
    if (!confirm(`Cancel invitation to ${playerName}?`)) {
      return;
    }

    // Show loading while canceling invitation
    showLocalLoader("playersList", {
      text: "Canceling invitation...",
      size: "small",
    });

    try {
      // Check authentication
      const authState = await checkAuthenticationState();
      if (!authState.authenticated) {
        hideLoadingSpinner("playersList");
        if (typeof showToast === "function") {
          showToast("Authentication required to cancel invitations.", "error");
        }
        return;
      }

      // Delete the invitation document
      await deleteDoc(doc(db, "coach_players", relationshipId));

      console.log("Invitation canceled:", relationshipId);

      // Refresh the list
      await loadPlayersList();

      // Show success message
      showSuccessMessage(`Invitation to ${playerName} has been canceled.`);
    } catch (error) {
      console.error("Error canceling invitation:", error);
      hideLoadingSpinner("playersList");

      // Show error message
      if (typeof showToast === "function") {
        showToast("Failed to cancel invitation. Please try again.", "error");
      } else {
        alert("Failed to cancel invitation. Please try again.");
      }
    }
  }

  // Get avatar for user based on their data
  function getAvatarForUser(userData) {
    // Use first letter of first and last name if available
    if (userData.name && userData.name.first && userData.name.last) {
      return `${userData.name.first[0]}${userData.name.last[0]}`.toUpperCase();
    } else if (userData.name && userData.name.first) {
      return userData.name.first[0].toUpperCase();
    } else if (userData.email) {
      return userData.email[0].toUpperCase();
    }
    return getRandomAvatar();
  }

  // Get a random avatar for new players
  function getRandomAvatar() {
    const avatars = ["👨‍💼", "👩‍💼", "🧑‍💼", "👨‍🎓", "👩‍🎓", "🧑‍🎓"];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  // Show success message
  function showSuccessMessage(message) {
    // Use the new toast system if available, otherwise fallback to basic implementation
    if (typeof showToast === "function") {
      showToast(message, "success");
    } else {
      // Fallback for when toast.js is not loaded
      const successDiv = document.createElement("div");
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        font-weight: 600;
        max-width: 400px;
        animation: slideIn 0.3s ease;
      `;
      successDiv.textContent = message;
      document.body.appendChild(successDiv);
      setTimeout(() => {
        successDiv.remove();
      }, 4000);
    }

    console.log("Success message shown:", message);
  }

  // Modal management functions
  function openAddPlayerModal() {
    const backdrop = document.getElementById("addPlayerBackdrop");
    const modal = document.getElementById("addPlayerModal");

    if (backdrop && modal) {
      backdrop.style.display = "block";
      modal.style.display = "block";

      setTimeout(() => {
        backdrop.classList.add("active");
        modal.classList.add("active");
      }, 10);

      document.body.style.overflow = "hidden";

      // Clear form
      document.getElementById("addPlayerForm").reset();
    }
  }

  function closeAddPlayerModal() {
    const backdrop = document.getElementById("addPlayerBackdrop");
    const modal = document.getElementById("addPlayerModal");

    if (backdrop && modal) {
      backdrop.classList.remove("active");
      modal.classList.remove("active");

      setTimeout(() => {
        backdrop.style.display = "none";
        modal.style.display = "none";
        document.body.style.overflow = "";
      }, 300);
    }
  }

  function openRemovePlayerModal(playerId, playerName) {
    selectedPlayerForRemoval = playerId;

    const backdrop = document.getElementById("removePlayerBackdrop");
    const modal = document.getElementById("removePlayerModal");
    const nameElement = document.getElementById("removePlayerName");

    if (backdrop && modal && nameElement) {
      nameElement.textContent = playerName;

      backdrop.style.display = "block";
      modal.style.display = "block";

      setTimeout(() => {
        backdrop.classList.add("active");
        modal.classList.add("active");
      }, 10);

      document.body.style.overflow = "hidden";
    }
  }

  function closeRemovePlayerModal() {
    const backdrop = document.getElementById("removePlayerBackdrop");
    const modal = document.getElementById("removePlayerModal");

    if (backdrop && modal) {
      backdrop.classList.remove("active");
      modal.classList.remove("active");

      setTimeout(() => {
        backdrop.style.display = "none";
        modal.style.display = "none";
        document.body.style.overflow = "";
        selectedPlayerForRemoval = null;
      }, 300);
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Add Player button
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener("click", openAddPlayerModal);
    }

    // Add Player Modal - Close buttons
    const closeAddPlayerModal1 = document.getElementById("closeAddPlayerModal");
    const cancelAddPlayer = document.getElementById("cancelAddPlayer");
    const addPlayerBackdrop = document.getElementById("addPlayerBackdrop");

    if (closeAddPlayerModal1) {
      closeAddPlayerModal1.addEventListener("click", closeAddPlayerModal);
    }
    if (cancelAddPlayer) {
      cancelAddPlayer.addEventListener("click", closeAddPlayerModal);
    }
    if (addPlayerBackdrop) {
      addPlayerBackdrop.addEventListener("click", (e) => {
        if (e.target === addPlayerBackdrop) {
          closeAddPlayerModal();
        }
      });
    }

    // Add Player Modal - Submit
    const submitAddPlayer = document.getElementById("submitAddPlayer");
    if (submitAddPlayer) {
      submitAddPlayer.addEventListener("click", async (e) => {
        e.preventDefault();

        const form = document.getElementById("addPlayerForm");
        const nameInput = document.getElementById("playerName");
        const emailInput = document.getElementById("playerEmail");

        if (form.checkValidity()) {
          const playerData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
          };

          // The email duplication check is now handled in handleAddPlayer() using Firestore
          await handleAddPlayer(playerData);
          closeAddPlayerModal();
        } else {
          form.reportValidity();
        }
      });
    }

    // Remove Player Modal - Close buttons
    const closeRemovePlayerModal1 = document.getElementById(
      "closeRemovePlayerModal"
    );
    const cancelRemovePlayer = document.getElementById("cancelRemovePlayer");
    const removePlayerBackdrop = document.getElementById(
      "removePlayerBackdrop"
    );

    if (closeRemovePlayerModal1) {
      closeRemovePlayerModal1.addEventListener("click", closeRemovePlayerModal);
    }
    if (cancelRemovePlayer) {
      cancelRemovePlayer.addEventListener("click", closeRemovePlayerModal);
    }
    if (removePlayerBackdrop) {
      removePlayerBackdrop.addEventListener("click", (e) => {
        if (e.target === removePlayerBackdrop) {
          closeRemovePlayerModal();
        }
      });
    }

    // Remove Player Modal - Confirm
    const confirmRemovePlayer = document.getElementById("confirmRemovePlayer");
    if (confirmRemovePlayer) {
      confirmRemovePlayer.addEventListener("click", async () => {
        if (selectedPlayerForRemoval) {
          await handleRemovePlayer(selectedPlayerForRemoval);
          closeRemovePlayerModal();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAddPlayerModal();
        closeRemovePlayerModal();
      }
    });
  }

  // Export functions for global access (called from HTML onclick attributes)
  window.openAddPlayerModal = openAddPlayerModal;
  window.openRemovePlayerModal = openRemovePlayerModal;
  window.cancelInvitation = cancelInvitation;

  // Initialize the page when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("My Players page initializing...");

    // Load and render players
    loadPlayersList();

    // Setup event listeners
    setupEventListeners();

    console.log("My Players page initialized successfully");
  });

  // Export functions for external use
  window.loadPlayersList = loadPlayersList;
  window.handleAddPlayer = handleAddPlayer;
  window.handleRemovePlayer = handleRemovePlayer;
  window.cancelInvitation = cancelInvitation;
})();
