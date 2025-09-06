// Authentication utility functions for ShuttleStats v2
// Reusable authentication helpers to prevent race conditions

/**
 * Check authentication state from multiple sources
 * @returns {Promise<Object>} Authentication state with user data
 */
async function checkAuthenticationState() {
  // Check Firebase auth state first
  if (window.currentUser && window.currentUserData) {
    return {
      authenticated: true,
      user: window.currentUser,
      userData: window.currentUserData,
    };
  }

  // Wait a bit for Firebase to initialize if not ready yet
  if (!window.currentUser) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check again after waiting
    if (window.currentUser && window.currentUserData) {
      return {
        authenticated: true,
        user: window.currentUser,
        userData: window.currentUserData,
      };
    }
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

/**
 * Wait for authentication to be ready with retry mechanism
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} interval - Interval between attempts (ms)
 * @returns {Promise<Object>} Authentication state
 */
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

/**
 * Show authentication required state in a container
 * @param {string} containerId - ID of container element
 * @param {Object} options - Display options
 */
function showAuthenticationRequired(containerId, options = {}) {
  const defaultOptions = {
    icon: "🔒",
    title: "Authentication Required",
    message: "Please log in to access this feature.",
    actionText: "Go to Login",
    onAction: () => {
      window.location.href = "index.html";
    },
  };

  const config = { ...defaultOptions, ...options };

  if (typeof showEmptyState === "function") {
    showEmptyState(containerId, config);
  } else {
    // Fallback if showEmptyState isn't available
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">${config.icon}</div>
          <h3 style="margin-bottom: 8px;">${config.title}</h3>
          <p style="margin-bottom: 24px; color: #666;">${config.message}</p>
          <button onclick="window.location.href='index.html'" 
                  style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
            ${config.actionText}
          </button>
        </div>
      `;
    }
  }
}

/**
 * Validate user role access
 * @param {string} requiredRole - Required role for access
 * @param {string} currentRole - Current user role
 * @param {string} redirectUrl - URL to redirect if unauthorized
 * @returns {boolean} Whether access is allowed
 */
function validateRoleAccess(requiredRole, currentRole, redirectUrl = null) {
  if (requiredRole === "coach" && currentRole !== "coach") {
    console.warn("User attempted to access coach features without proper role");

    if (typeof showToast === "function") {
      showToast("You do not have access to coach features.", "error");
    } else {
      alert("You do not have access to coach features.");
    }

    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }

    return false;
  }

  return true;
}

/**
 * Initialize page with authentication guard
 * @param {Function} initFunction - Function to run after authentication is verified
 * @param {Object} options - Configuration options
 */
async function initWithAuthGuard(initFunction, options = {}) {
  const {
    containerId = "mainContainer",
    requireRole = null,
    redirectUrl = "goals.html?user=player",
    maxAttempts = 10,
    interval = 500,
  } = options;

  try {
    // Wait for authentication to be ready
    const authState = await waitForAuthentication(maxAttempts, interval);

    if (!authState.authenticated) {
      console.error("No authenticated user found. User needs to log in.");

      // Show error message to user
      if (typeof showToast === "function") {
        showToast("Please log in to access this feature.", "error");
      }

      // Show authentication required state
      showAuthenticationRequired(containerId, {
        message: "Please log in to access this feature.",
      });

      return false; // Initialization failed
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

    // Validate role if required
    if (requireRole) {
      const access = validateRoleAccess(
        requireRole,
        authState.userData?.role,
        redirectUrl
      );

      if (!access) {
        return false; // Access denied
      }
    }

    // Run the initialization function
    await initFunction(authState);

    return true; // Initialization successful
  } catch (error) {
    console.error("Error during authentication guard:", error);

    // Show error state
    const container = document.getElementById(containerId);
    if (container && typeof showEmptyState === "function") {
      showEmptyState(containerId, {
        icon: "⚠️",
        title: "Initialization Error",
        message: "Unable to load the page. Please refresh and try again.",
        actionText: "Refresh Page",
        onAction: () => {
          window.location.reload();
        },
      });
    }

    if (typeof showToast === "function") {
      showToast("Error loading page. Please try refreshing.", "error");
    }

    return false;
  }
}

// Export functions as ES6 modules
export {
  checkAuthenticationState,
  waitForAuthentication,
  showAuthenticationRequired,
  validateRoleAccess,
  initWithAuthGuard,
};

// Also export for CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    checkAuthenticationState,
    waitForAuthentication,
    showAuthenticationRequired,
    validateRoleAccess,
    initWithAuthGuard,
  };
}

// Make functions available globally
window.authUtils = {
  checkAuthenticationState,
  waitForAuthentication,
  showAuthenticationRequired,
  validateRoleAccess,
  initWithAuthGuard,
};
