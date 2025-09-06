// ShuttleStats v2 - Role Manager
// This script manages user role state across all pages and applies appropriate UI changes

(function () {
  "use strict";

  console.log("Role Manager: Initializing...");

  // Get current user role from sessionStorage
  const userRole = sessionStorage.getItem("userRole");
  const currentUserId = sessionStorage.getItem("currentUserId");
  const currentUserData = JSON.parse(sessionStorage.getItem("currentUser"));
  const currentPage = window.location.pathname.split("/").pop();

  // Central dashboard navigation function
  function navigateToDashboard() {
    const role = sessionStorage.getItem("userRole");
    if (role === "coach") {
      window.location.href = "coach-dashboard.html";
    } else {
      window.location.href = "player-dashboard.html";
    }
  }

  console.log("Role Manager: User role:", userRole);
  console.log("Role Manager: Current page:", currentPage);

  // Page title mappings for coach mode
  const COACH_PAGE_TITLES = {
    "training.html": "Manage Training",
    "matches.html": "Manage Matches",
    "goals.html": "Manage Goals",
    "schedule.html": "Team Schedule",
  };

  // Apply role-based UI changes
  function applyRoleBasedUI() {
    if (userRole === "coach") {
      console.log("Role Manager: Applying coach UI...");
      applyCoachUI();
    } else {
      console.log("Role Manager: Applying player UI...");
      applyPlayerUI();
    }
  }

  // Apply coach-specific UI changes
  function applyCoachUI() {
    // Update sidebar navigation for coach
    updateSidebarForCoach();

    // Update page title for coach if applicable
    updatePageTitleForCoach();

    // Update user profile display
    updateUserProfileDisplay("Coach");
  }

  // Apply player-specific UI changes
  function applyPlayerUI() {
    // Update sidebar navigation for player
    updateSidebarForPlayer();

    // Update user profile display
    updateUserProfileDisplay("Player");
  }

  // Update sidebar navigation for coach
  function updateSidebarForCoach() {
    const sidebar = document.querySelector(".sidebar-nav");
    if (!sidebar) {
      console.log("Role Manager: Sidebar navigation not found");
      return;
    }

    // Replace sidebar content with coach navigation
    sidebar.innerHTML = `
      <div class="nav-group">
        <div class="nav-label">Overview</div>
        <ul class="nav-list">
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "coach-dashboard.html" ? "active" : ""
            }" href="coach-dashboard.html">
              Coach Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "schedule.html" ? "active" : ""
            }" href="schedule.html?user=coach">
              Schedule
            </a>
          </li>
        </ul>
      </div>
      <div class="nav-group">
        <div class="nav-label">Player Management</div>
        <ul class="nav-list">
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "my-players.html" ? "active" : ""
            }" href="my-players.html">
              My Players
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "training.html" ? "active" : ""
            }" href="training.html?user=coach">
              Training
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "matches.html" ? "active" : ""
            }" href="matches.html?user=coach">
              Matches
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "goals.html" ? "active" : ""
            }" href="goals.html?user=coach">
              Goals
            </a>
          </li>
        </ul>
      </div>
      <div class="nav-group">
        <div class="nav-label">Analytics</div>
        <ul class="nav-list">
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "progress.html" ? "active" : ""
            }" href="progress.html?user=coach">
              Progress
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "achievement.html" ? "active" : ""
            }" href="achievement.html?user=coach">
              Achievements
            </a>
          </li>
        </ul>
      </div>
    `;

    console.log("Role Manager: Coach sidebar navigation applied");
  }

  // Update sidebar navigation for player
  function updateSidebarForPlayer() {
    const sidebar = document.querySelector(".sidebar-nav");
    if (!sidebar) {
      console.log("Role Manager: Sidebar navigation not found");
      return;
    }

    // Replace sidebar content with player navigation
    sidebar.innerHTML = `
      <div class="nav-group">
        <div class="nav-label">Overview</div>
        <ul class="nav-list">
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "player-dashboard.html" ? "active" : ""
            }" href="player-dashboard.html">
              Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "training.html" ? "active" : ""
            }" href="training.html">
              Training
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "matches.html" ? "active" : ""
            }" href="matches.html">
              Matches
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "schedule.html" ? "active" : ""
            }" href="schedule.html">
              Schedule
            </a>
          </li>
        </ul>
      </div>
      <div class="nav-group">
        <div class="nav-label">Player Tools</div>
        <ul class="nav-list">
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "progress.html" ? "active" : ""
            }" href="progress.html">
              Progress
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "achievement.html" ? "active" : ""
            }" href="achievement.html">
              Achievement
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${
              currentPage === "goals.html" ? "active" : ""
            }" href="goals.html">
              Goals
            </a>
          </li>
        </ul>
      </div>
    `;

    console.log("Role Manager: Player sidebar navigation applied");
  }

  // Update page title for coach mode
  function updatePageTitleForCoach() {
    const pageTitle =
      document.querySelector(".page-title h1") || document.querySelector("h1");
    const coachTitle = COACH_PAGE_TITLES[currentPage];

    if (pageTitle && coachTitle) {
      pageTitle.textContent = coachTitle;
      console.log("Role Manager: Page title updated to:", coachTitle);
    }
  }

  // Update user profile display
  function updateUserProfileDisplay(roleName) {
    const userNameElement = document.querySelector(".user-profile .user-name");
    if (userNameElement) {
      // Use the centrally stored user data
      if (currentUserData && currentUserData.name) {
        updatePersonalizedUserGreeting(currentUserData);
      } else {
        // Fallback to role-based display
        userNameElement.textContent = roleName;
        console.log("Role Manager: User profile updated to:", roleName);
      }
    }
  }

  // Personalized user greeting function (integrated from user-greeting.js)
  function updatePersonalizedUserGreeting(userData) {
    const userNameElement = document.querySelector(".user-profile .user-name");

    if (!userNameElement) {
      console.warn(
        "Role Manager: User greeting element not found (.user-name)"
      );
      return;
    }

    if (!userData || !userData.name) {
      console.warn(
        "Role Manager: Invalid user data provided to updatePersonalizedUserGreeting"
      );
      userNameElement.innerHTML =
        '<span class="name">User</span> <span class="role">(Unknown)</span>';
      return;
    }

    // Extract name components
    const { first, middle, last } = userData.name;
    const role = userData.role || "user";

    // Build full name string
    let fullName = first || "User";
    if (last) {
      fullName += ` ${last}`;
    }

    // Capitalize role for display
    const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

    // Update the element with structured HTML for styling
    userNameElement.innerHTML = `
      <span class="name">${fullName}</span> 
      <span class="role">(${displayRole})</span>
    `;

    console.log(
      `Role Manager: Updated personalized greeting: ${fullName} (${displayRole})`
    );
  }

  // Initialize user greeting system and listen for auth state changes
  function initializeUserGreeting() {
    // Check if user data is already available
    if (window.currentUserData) {
      updatePersonalizedUserGreeting(window.currentUserData);
    }

    // Listen for auth state changes from Firebase
    window.addEventListener("authStateChanged", (event) => {
      const { userData } = event.detail;
      if (userData) {
        updatePersonalizedUserGreeting(userData);
      } else {
        // Handle signed out state - fallback to role-based display
        const role = sessionStorage.getItem("userRole");
        if (role) {
          updateUserProfileDisplay(role === "coach" ? "Coach" : "Player");
        } else {
          const userNameElement = document.querySelector(
            ".user-profile .user-name"
          );
          if (userNameElement) {
            userNameElement.innerHTML =
              '<span class="name">Please Login</span>';
          }
        }
      }
    });

    console.log("Role Manager: User greeting system initialized");
  }

  // Handle sign out functionality
  function setupSignOutHandler() {
    const signOutBtns = document.querySelectorAll(".signout-btn, #signout-btn");
    signOutBtns.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();

        // Clear sessionStorage
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("currentUserId");
        sessionStorage.removeItem("currentUser");
        console.log("Role Manager: User data cleared from sessionStorage");

        // Redirect to login page
        window.location.href = "login.html";
      });
    });
  }

  // Automatic URL parameter injection for coach
  function handleCoachModeURLs() {
    if (userRole === "coach") {
      const urlParams = new URLSearchParams(window.location.search);
      const hasCoachParam = urlParams.get("user") === "coach";

      // Pages that should have coach parameter
      const coachPages = [
        "training.html",
        "matches.html",
        "goals.html",
        "schedule.html",
        "progress.html",
        "achievement.html",
      ];

      if (coachPages.includes(currentPage) && !hasCoachParam) {
        // Add coach parameter and reload page
        const newUrl = `${window.location.pathname}?user=coach${window.location.hash}`;
        console.log("Role Manager: Redirecting to coach mode URL:", newUrl);
        window.location.replace(newUrl);
        return false; // Prevent further execution
      }
    }
    return true;
  }

  // Main initialization function
  function initialize() {
    console.log("Role Manager: Starting initialization...");

    // Handle URL redirection for coach mode
    if (!handleCoachModeURLs()) {
      return; // Exit if redirecting
    }

    // Wait for DOM to be ready
    function setupLogoNavigation() {
      var logo = document.getElementById("main-logo-link");
      if (logo) {
        logo.addEventListener("click", navigateToDashboard);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        applyRoleBasedUI();
        initializeUserGreeting();
        setupSignOutHandler();
        setupLogoNavigation();
        console.log("Role Manager: Initialization complete (DOM loaded)");
      });
    } else {
      // DOM is already ready
      applyRoleBasedUI();
      initializeUserGreeting();
      setupSignOutHandler();
      setupLogoNavigation();
      console.log("Role Manager: Initialization complete (DOM ready)");
    }
  }

  // Error handling wrapper
  try {
    initialize();
  } catch (error) {
    console.error("Role Manager: Error during initialization:", error);
    // Fallback to player UI in case of errors
    if (document.readyState !== "loading") {
      applyPlayerUI();
      initializeUserGreeting();
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        applyPlayerUI();
        initializeUserGreeting();
      });
    }
  }

  // Export functions for debugging (optional)
  window.RoleManager = {
    getCurrentRole: () => userRole,
    refreshUI: applyRoleBasedUI,
    setRole: (role) => {
      sessionStorage.setItem("userRole", role);
      location.reload();
    },
  };
})();
