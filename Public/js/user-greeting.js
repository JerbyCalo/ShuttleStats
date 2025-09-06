// ShuttleStats v2 - User Greeting System
// Handles dynamic user name display in headers across all authenticated pages

/**
 * Updates the user greeting in the header with personalized name and role
 * @param {Object} userData - User data object from Firebase/global state
 * @param {Object} userData.name - Name object with first, middle, last
 * @param {string} userData.role - User role (player/coach)
 */
function updateUserGreeting(userData) {
  const userNameElement = document.querySelector(".user-name");

  if (!userNameElement) {
    console.warn("User greeting element not found (.user-name)");
    return;
  }

  if (!userData || !userData.name) {
    console.warn("Invalid user data provided to updateUserGreeting");
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

  console.log(`Updated user greeting: ${fullName} (${displayRole})`);
}

/**
 * Initializes the user greeting system on page load
 * Listens for auth state changes and updates greeting accordingly
 */
function initUserGreeting() {
  // Check if user data is already available
  if (window.currentUserData) {
    updateUserGreeting(window.currentUserData);
  }

  // Listen for auth state changes
  window.addEventListener("authStateChanged", (event) => {
    const { userData } = event.detail;
    if (userData) {
      updateUserGreeting(userData);
    } else {
      // Handle signed out state
      const userNameElement = document.querySelector(".user-name");
      if (userNameElement) {
        userNameElement.innerHTML = '<span class="name">Please Login</span>';
      }
    }
  });

  console.log("User greeting system initialized");
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initUserGreeting();
});

// Export for manual usage if needed
if (typeof window !== "undefined") {
  window.updateUserGreeting = updateUserGreeting;
  window.initUserGreeting = initUserGreeting;
}
