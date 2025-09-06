// ShuttleStats v2 - Player Dashboard population
console.log("player-dashboard.js loaded");

// Import Firebase functions for invitation handling and data queries
import {
  db,
  auth,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  orderBy,
  limit,
  getCountFromServer,
} from "../config/firebase-config.js";

// Import authentication utilities
import { checkAuthenticationState } from "./auth-utils.js";

(function () {
  function setActiveNav() {
    const dashboardLink = document.getElementById("navDashboard");
    if (dashboardLink) {
      dashboardLink.classList.add("active");
      console.log("Dashboard nav set to active");
    }
  }

  function populateHeader(data) {
    const dateEl = document.getElementById("dateString");
    if (dateEl) {
      dateEl.textContent = data.dateString;
      console.log("Date populated:", data.dateString);
    }
  }

  // Calculate metrics from Firestore data
  async function calculateMetrics(currentUserId) {
    console.log("Calculating metrics from Firestore for user:", currentUserId);

    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(
        today.getTime() - 30 * 24 * 60 * 60 * 1000
      );

      // Get training sessions count (last 30 days)
      const trainingQuery = query(
        collection(db, "training"),
        where("playerId", "==", currentUserId),
        where("date", ">=", thirtyDaysAgo.toISOString().split("T")[0])
      );
      const trainingCountSnapshot = await getCountFromServer(trainingQuery);
      const trainingSessions = trainingCountSnapshot.data().count;

      // Get matches count (last 30 days)
      const matchesQuery = query(
        collection(db, "matches"),
        where("playerId", "==", currentUserId),
        where("date", ">=", thirtyDaysAgo.toISOString().split("T")[0])
      );
      const matchesCountSnapshot = await getCountFromServer(matchesQuery);
      const matchesPlayed = matchesCountSnapshot.data().count;

      // Get goals achieved count
      const goalsQuery = query(
        collection(db, "goals"),
        where("playerId", "==", currentUserId),
        where("status", "==", "Completed")
      );
      const goalsCountSnapshot = await getCountFromServer(goalsQuery);
      const goalsAchieved = goalsCountSnapshot.data().count;

      // Calculate win streak from recent matches
      const recentMatchesQuery = query(
        collection(db, "matches"),
        where("playerId", "==", currentUserId),
        orderBy("date", "desc"),
        limit(10)
      );
      const recentMatchesSnapshot = await getDocs(recentMatchesQuery);
      const recentMatches = recentMatchesSnapshot.docs.map((doc) => doc.data());

      let currentStreak = 0;
      let bestWinStreak = 0;
      let tempStreak = 0;

      recentMatches.forEach((match) => {
        if (match.result && match.result.toLowerCase() === "win") {
          tempStreak++;
          if (currentStreak === 0) currentStreak = tempStreak;
          bestWinStreak = Math.max(bestWinStreak, tempStreak);
        } else {
          if (currentStreak === 0) currentStreak = 0;
          tempStreak = 0;
        }
      });

      // Calculate improvement rate (simplified - based on recent vs older performance)
      let improvementRate = 0;
      if (recentMatches.length >= 6) {
        const recentWins = recentMatches
          .slice(0, 3)
          .filter((m) => m.result?.toLowerCase() === "win").length;
        const olderWins = recentMatches
          .slice(3, 6)
          .filter((m) => m.result?.toLowerCase() === "win").length;
        if (olderWins > 0) {
          improvementRate = Math.round(
            ((recentWins - olderWins) / olderWins) * 100
          );
        }
      }

      console.log("Calculated metrics:", {
        trainingSessions,
        matchesPlayed,
        improvementRate,
        goalsAchieved,
        bestWinStreak,
      });

      return {
        trainingSessions,
        matchesPlayed,
        improvementRate,
        goalsAchieved,
        bestWinStreak,
      };
    } catch (error) {
      console.error("Error calculating metrics:", error);
      // Return default values on error
      return {
        trainingSessions: 0,
        matchesPlayed: 0,
        improvementRate: 0,
        goalsAchieved: 0,
        bestWinStreak: 0,
      };
    }
  }

  // Populate metrics display
  function populateMetrics(metrics) {
    const map = {
      metricTrainingSessions: metrics.trainingSessions,
      metricMatchesPlayed: metrics.matchesPlayed,
      metricImprovementRate: `${metrics.improvementRate}%`,
      metricGoalsAchieved: metrics.goalsAchieved,
      metricBestWinStreak: metrics.bestWinStreak,
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
        console.log(`Metric ${id} populated with:`, value);
      }
    });
  }

  // Populate activities display
  function populateActivities(activities) {
    const ul = document.getElementById("recentActivitiesList");
    if (!ul) {
      console.warn("Activities list element not found");
      return;
    }

    // Clear existing content
    ul.innerHTML = "";

    // Check for empty activities
    if (!activities || activities.length === 0) {
      const parentSection =
        ul.closest(".recent-activities-section") || ul.parentElement;
      if (parentSection) {
        showEmptyState(parentSection.id || "recentActivitiesSection", {
          icon: "📝",
          title: "No Recent Activities",
          message:
            "Start training or playing matches to see your recent activities here.",
        });
      }
      return;
    }

    // Populate with activities from Firestore data
    activities.forEach((item, index) => {
      const li = document.createElement("li");

      const title = document.createElement("div");
      title.className = "activity-title";
      title.textContent = item.title;

      const time = document.createElement("div");
      time.className = "activity-time";
      time.textContent = item.timestamp;

      li.appendChild(title);
      li.appendChild(time);
      ul.appendChild(li);

      console.log(`Activity ${index + 1} added:`, item.title);
    });
  }

  // Get recent activities from Firestore
  async function getRecentActivities(currentUserId) {
    console.log(
      "Fetching recent activities from Firestore for user:",
      currentUserId
    );

    try {
      const activities = [];

      // Get recent training sessions (last 3)
      const recentTrainingQuery = query(
        collection(db, "training"),
        where("playerId", "==", currentUserId),
        orderBy("date", "desc"),
        limit(3)
      );
      const trainingSnapshot = await getDocs(recentTrainingQuery);

      trainingSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.date);
        const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        let timestamp;

        if (daysAgo === 0) timestamp = "Today";
        else if (daysAgo === 1) timestamp = "1 day ago";
        else timestamp = `${daysAgo} days ago`;

        activities.push({
          title: `Training Session - ${data.type || "General"}`,
          timestamp: timestamp,
          date: data.date,
          type: "training",
        });
      });

      // Get recent matches (last 2)
      const recentMatchesQuery = query(
        collection(db, "matches"),
        where("playerId", "==", currentUserId),
        orderBy("date", "desc"),
        limit(2)
      );
      const matchesSnapshot = await getDocs(recentMatchesQuery);

      matchesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.date);
        const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        let timestamp;

        if (daysAgo === 0) timestamp = "Today";
        else if (daysAgo === 1) timestamp = "1 day ago";
        else timestamp = `${daysAgo} days ago`;

        const result = data.result || "Completed";
        activities.push({
          title: `Match vs ${data.opponent} - ${result}`,
          timestamp: timestamp,
          date: data.date,
          type: "match",
        });
      });

      // Sort activities by date (most recent first)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log("Fetched recent activities:", activities);
      return activities.slice(0, 5); // Return top 5 most recent
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  }

  // Check for pending coach invitations
  async function checkPendingInvitations() {
    console.log("Checking for pending coach invitations...");

    // Get the current user from the auth instance (guaranteed to be authenticated)
    const currentUser = auth.currentUser;
    const userEmail = currentUser.email.toLowerCase();
    console.log("Checking invitations for email:", userEmail);

    try {
      // 1. Create a query for the database to execute (server-side filtering)
      const invitationsQuery = query(
        collection(db, "coach_players"),
        where("playerEmail", "==", userEmail), // Server-side filter
        where("status", "==", "pending") // Server-side filter
      );

      // 2. Execute the query
      const querySnapshot = await getDocs(invitationsQuery);

      // 3. Check if any documents were found
      if (querySnapshot.empty) {
        console.log("No pending invitations found");
        return;
      }

      console.log(`Found ${querySnapshot.docs.length} pending invitation(s)`);

      // Get coach details for each invitation
      const invitations = [];
      for (const inviteDoc of querySnapshot.docs) {
        const inviteData = inviteDoc.data();

        try {
          // Get coach information
          const coachDoc = await getDoc(doc(db, "users", inviteData.coachId));
          if (coachDoc.exists()) {
            const coachData = coachDoc.data();
            invitations.push({
              id: inviteDoc.id,
              coachId: inviteData.coachId,
              coachName:
                `${coachData.name.first} ${coachData.name.last}`.trim(),
              coachEmail: coachData.email,
              invitedAt: inviteData.invitedAt,
              playerName: inviteData.playerName,
            });
          }
        } catch (error) {
          console.error("Error fetching coach data:", error);
          // Still show the invitation even if we can't get coach details
          invitations.push({
            id: inviteDoc.id,
            coachId: inviteData.coachId,
            coachName: inviteData.coachName || "Unknown Coach", // Use stored coachName if available
            coachEmail: "unknown@email.com",
            invitedAt: inviteData.invitedAt,
            playerName: inviteData.playerName,
          });
        }
      }

      if (invitations.length > 0) {
        displayInvitationNotifications(invitations);
      }
    } catch (error) {
      console.error("Error checking pending invitations:", error);

      // Show error toast if available
      if (typeof showToast === "function") {
        showToast("Failed to check for coach invitations", "error");
      }
    }
  }

  // Display invitation notifications
  function displayInvitationNotifications(invitations) {
    console.log("Displaying invitation notifications:", invitations);

    // Find a place to insert the notifications (top of main content)
    const mainContent = document.getElementById("mainContent");
    const pageTitle = document.querySelector(".page-title");

    if (!mainContent || !pageTitle) {
      console.error("Could not find elements to display notifications");
      return;
    }

    // Remove any existing notifications
    const existingNotifications = mainContent.querySelectorAll(
      ".invitation-notification"
    );
    existingNotifications.forEach((notification) => notification.remove());

    // Create notification container
    const notificationContainer = document.createElement("div");
    notificationContainer.className = "invitation-notifications";
    notificationContainer.innerHTML = `
      <style>
        .invitation-notifications {
          margin: 24px 0;
        }
        
        .invitation-notification {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 16px;
          color: white;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
          animation: slideInDown 0.5s ease;
        }
        
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .notification-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .notification-icon {
          font-size: 24px;
        }
        
        .notification-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
        }
        
        .notification-body {
          margin-bottom: 20px;
          line-height: 1.5;
        }
        
        .coach-info {
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .invitation-date {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        .notification-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .invitation-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }
        
        .accept-btn {
          background: #10b981;
          color: white;
        }
        
        .accept-btn:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        
        .decline-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .decline-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }
        
        .loading-btn {
          opacity: 0.7;
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          .invitation-notification {
            padding: 16px 20px;
          }
          
          .notification-actions {
            flex-direction: column;
          }
          
          .invitation-btn {
            width: 100%;
            justify-content: center;
          }
        }
      </style>
    `;

    // Create notification for each invitation
    invitations.forEach((invitation) => {
      const notificationDiv = document.createElement("div");
      notificationDiv.className = "invitation-notification";
      notificationDiv.dataset.invitationId = invitation.id;

      const invitationDate = invitation.invitedAt
        ? new Date(invitation.invitedAt.toDate()).toLocaleDateString()
        : "Recently";

      notificationDiv.innerHTML = `
        <div class="notification-header">
          <span class="notification-icon">🏸</span>
          <h3 class="notification-title">Coach Invitation Received!</h3>
        </div>
        <div class="notification-body">
          <div class="coach-info">
            ${invitation.coachName} has invited you to join their coaching program.
          </div>
          <div class="invitation-date">Invited ${invitationDate}</div>
        </div>
        <div class="notification-actions">
          <button class="invitation-btn accept-btn" 
                  onclick="acceptCoachInvitation('${invitation.id}', '${invitation.coachName}')">
            ✅ Accept Invitation
          </button>
          <button class="invitation-btn decline-btn"
                  onclick="declineCoachInvitation('${invitation.id}', '${invitation.coachName}')">
            ❌ Decline
          </button>
        </div>
      `;

      notificationContainer.appendChild(notificationDiv);
    });

    // Insert notifications after page title
    pageTitle.insertAdjacentElement("afterend", notificationContainer);

    console.log(`${invitations.length} invitation notification(s) displayed`);
  }

  // Accept coach invitation
  async function acceptCoachInvitation(invitationId, coachName) {
    console.log("Accepting coach invitation:", invitationId);

    try {
      // Get the notification element and show loading state
      const notificationElement = document.querySelector(
        `[data-invitation-id="${invitationId}"]`
      );
      if (notificationElement) {
        const acceptBtn = notificationElement.querySelector(".accept-btn");
        const declineBtn = notificationElement.querySelector(".decline-btn");

        if (acceptBtn) {
          acceptBtn.textContent = "⏳ Accepting...";
          acceptBtn.classList.add("loading-btn");
        }
        if (declineBtn) {
          declineBtn.disabled = true;
          declineBtn.classList.add("loading-btn");
        }
      }

      // Check authentication
      const authState = await checkAuthenticationState();
      if (!authState.authenticated) {
        throw new Error("Authentication required");
      }

      // Get the invitation document
      const invitationDoc = await getDoc(
        doc(db, "coach_players", invitationId)
      );
      if (!invitationDoc.exists()) {
        throw new Error("Invitation not found");
      }

      const invitationData = invitationDoc.data();

      // Verify the current user's email matches the invitation
      if (
        invitationData.playerEmail.toLowerCase() !==
        authState.user.email.toLowerCase()
      ) {
        throw new Error("Invitation email does not match current user");
      }

      // Use a batched write to update both documents atomically
      const batch = writeBatch(db);

      // Update the coach-player relationship
      batch.update(doc(db, "coach_players", invitationId), {
        status: "accepted",
        acceptedAt: new Date(),
        playerId: authState.user.uid, // Now we know the player's ID
      });

      // Update the player's user document to add the coach
      batch.update(doc(db, "users", authState.user.uid), {
        coachId: invitationData.coachId,
        updatedAt: new Date(),
      });

      // Commit the batch
      await batch.commit();

      console.log("Successfully accepted coach invitation");

      // Remove the notification
      if (notificationElement) {
        notificationElement.style.animation = "slideInDown 0.3s ease reverse";
        setTimeout(() => {
          notificationElement.remove();

          // Remove parent container if no more notifications
          const notificationContainer = document.querySelector(
            ".invitation-notifications"
          );
          if (
            notificationContainer &&
            !notificationContainer.querySelector(".invitation-notification")
          ) {
            notificationContainer.remove();
          }
        }, 300);
      }

      // Show success message
      if (typeof showToast === "function") {
        showToast(
          `🎉 Successfully joined ${coachName}'s coaching program!`,
          "success",
          5000
        );
      }

      // Update global user data cache
      if (window.currentUserData) {
        window.currentUserData.coachId = invitationData.coachId;
      }
    } catch (error) {
      console.error("Error accepting coach invitation:", error);

      // Restore button states
      const notificationElement = document.querySelector(
        `[data-invitation-id="${invitationId}"]`
      );
      if (notificationElement) {
        const acceptBtn = notificationElement.querySelector(".accept-btn");
        const declineBtn = notificationElement.querySelector(".decline-btn");

        if (acceptBtn) {
          acceptBtn.textContent = "✅ Accept Invitation";
          acceptBtn.classList.remove("loading-btn");
        }
        if (declineBtn) {
          declineBtn.disabled = false;
          declineBtn.classList.remove("loading-btn");
        }
      }

      // Show error message
      const errorMessage =
        error.message === "Authentication required"
          ? "Please log in to accept the invitation"
          : "Failed to accept invitation. Please try again.";

      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
    }
  }

  // Decline coach invitation (optional - for future implementation)
  async function declineCoachInvitation(invitationId, coachName) {
    console.log("Declining coach invitation:", invitationId);

    try {
      // Get the notification element and show loading state
      const notificationElement = document.querySelector(
        `[data-invitation-id="${invitationId}"]`
      );
      if (notificationElement) {
        const acceptBtn = notificationElement.querySelector(".accept-btn");
        const declineBtn = notificationElement.querySelector(".decline-btn");

        if (declineBtn) {
          declineBtn.textContent = "⏳ Declining...";
          declineBtn.classList.add("loading-btn");
        }
        if (acceptBtn) {
          acceptBtn.disabled = true;
          acceptBtn.classList.add("loading-btn");
        }
      }

      // Check authentication
      const authState = await checkAuthenticationState();
      if (!authState.authenticated) {
        throw new Error("Authentication required");
      }

      // Update the invitation status to declined
      await updateDoc(doc(db, "coach_players", invitationId), {
        status: "declined",
        declinedAt: new Date(),
      });

      console.log("Successfully declined coach invitation");

      // Remove the notification
      if (notificationElement) {
        notificationElement.style.animation = "slideInDown 0.3s ease reverse";
        setTimeout(() => {
          notificationElement.remove();

          // Remove parent container if no more notifications
          const notificationContainer = document.querySelector(
            ".invitation-notifications"
          );
          if (
            notificationContainer &&
            !notificationContainer.querySelector(".invitation-notification")
          ) {
            notificationContainer.remove();
          }
        }, 300);
      }

      // Show info message
      if (typeof showToast === "function") {
        showToast(`Declined invitation from ${coachName}`, "info");
      }
    } catch (error) {
      console.error("Error declining coach invitation:", error);

      // Restore button states
      const notificationElement = document.querySelector(
        `[data-invitation-id="${invitationId}"]`
      );
      if (notificationElement) {
        const acceptBtn = notificationElement.querySelector(".accept-btn");
        const declineBtn = notificationElement.querySelector(".decline-btn");

        if (declineBtn) {
          declineBtn.textContent = "❌ Decline";
          declineBtn.classList.remove("loading-btn");
        }
        if (acceptBtn) {
          acceptBtn.disabled = false;
          acceptBtn.classList.remove("loading-btn");
        }
      }

      // Show error message
      if (typeof showToast === "function") {
        showToast("Failed to decline invitation. Please try again.", "error");
      }
    }
  }

  function setupQuickActions() {
    const actions = [
      {
        text: "🏃‍♂️ Log Training Session",
        action: function () {
          if (window.openLogTrainingModal) {
            window.openLogTrainingModal();
          } else {
            console.warn("openLogTrainingModal function not available");
          }
        },
      },
      {
        text: "🏆 Record Match",
        action: function () {
          if (window.openRecordMatchModal) {
            window.openRecordMatchModal();
          } else {
            console.warn("openRecordMatchModal function not available");
          }
        },
      },
      {
        text: "📅 View Schedule",
        action: function () {
          console.log("Navigating to Schedule Page");
          window.location.href = "schedule.html";
        },
      },
      {
        text: "🎯 Set New Goal",
        action: function () {
          if (window.openSetGoalModal) {
            window.openSetGoalModal();
          } else {
            console.warn("openSetGoalModal function not available");
          }
        },
      },
    ];

    const actionsContainer = document.getElementById("quickActionsGrid");
    if (!actionsContainer) {
      console.warn("Quick Actions Grid container not found");
      return;
    }

    // Clear existing buttons
    actionsContainer.innerHTML = "";

    // Create new functional action cards
    actions.forEach((actionData, index) => {
      const button = document.createElement("button");
      button.className = "action-card";
      button.type = "button";
      button.textContent = actionData.text;

      button.addEventListener("click", () => {
        console.log(`Quick action clicked: ${actionData.text}`);

        // Add visual feedback
        button.style.transform = "translateY(-5px) scale(0.98)";
        setTimeout(() => {
          button.style.transform = "";
          // Execute the action
          if (typeof actionData.action === "function") {
            actionData.action();
          }
        }, 150);
      });

      actionsContainer.appendChild(button);
      console.log(`Quick action card ${index + 1} added:`, actionData.text);
    });
  }

  function setupNavigation() {
    const navLinks = {
      Training: "training.html",
      Matches: "matches.html",
      Schedule: "schedule.html",
      Progress: "progress.html",
      Achievement: "achievement.html",
      Goals: "goals.html",
    };

    Object.entries(navLinks).forEach(([linkText, targetUrl]) => {
      // Find nav links by their text content
      const navLink = Array.from(document.querySelectorAll(".nav-link")).find(
        (link) => link.textContent.trim() === linkText
      );

      if (navLink) {
        navLink.addEventListener("click", (e) => {
          e.preventDefault(); // Prevent default link behavior
          console.log(`Navigating to ${targetUrl}`);

          // Add visual feedback
          navLink.style.transform = "translateX(8px)";
          setTimeout(() => {
            navLink.style.transform = "";
            // Navigate to the target page
            window.location.href = targetUrl;
          }, 200);
        });
        console.log(
          `Navigation handler added for: ${linkText} -> ${targetUrl}`
        );
      }
    });
  }

  window.loadPlayerDashboard = async function loadPlayerDashboard() {
    console.log("Loading player dashboard...");

    // Show loading states for different sections
    showLocalLoader("metricsGrid", {
      text: "Loading dashboard metrics...",
      size: "small",
    });

    showLocalLoader("recentActivitiesSection", {
      text: "Loading recent activities...",
      size: "small",
    });

    showLocalLoader("quickActionsGrid", {
      text: "Setting up quick actions...",
      size: "small",
    });

    try {
      // Check authentication
      const currentUserId = sessionStorage.getItem("currentUserId");
      if (!currentUserId) {
        throw new Error("User not authenticated");
      }

      // Execute all dashboard setup functions with staggered loading
      setActiveNav();

      // Populate header with current date
      const today = new Date();
      const dateString = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      populateHeader({ dateString });

      // Load metrics from Firestore
      const metrics = await calculateMetrics(currentUserId);
      populateMetrics(metrics);
      hideLoadingSpinner("metricsGrid");

      // Small delay for better UX
      await simulateNetworkDelay(200);

      // Load activities from Firestore
      const activities = await getRecentActivities(currentUserId);
      populateActivities(activities);
      hideLoadingSpinner("recentActivitiesSection");

      // Small delay for better UX
      await simulateNetworkDelay(200);

      // Load quick actions
      setupQuickActions();
      hideLoadingSpinner("quickActionsGrid");

      // Setup navigation (no loading state needed)
      setupNavigation();

      console.log("Player dashboard loaded successfully");
    } catch (error) {
      console.error("Error loading player dashboard:", error);

      // Hide all loading spinners on error
      hideLoadingSpinner("metricsGrid");
      hideLoadingSpinner("recentActivitiesSection");
      hideLoadingSpinner("quickActionsGrid");

      // Show error states
      if (error.message === "User not authenticated") {
        // Redirect to login
        window.location.href = "login.html";
        return;
      }

      showEmptyState("metricsGrid", {
        icon: "⚠️",
        title: "Failed to Load Metrics",
        message:
          "Unable to load dashboard metrics. Please try refreshing the page.",
      });
    }
  };

  // Auto-run on DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("metricsGrid")) {
      console.log("Player dashboard detected, initializing...");
      window.loadPlayerDashboard();
    }
  });

  // Export invitation functions to global scope
  window.acceptCoachInvitation = acceptCoachInvitation;
  window.declineCoachInvitation = declineCoachInvitation;
  window.checkPendingInvitations = checkPendingInvitations;
})();
