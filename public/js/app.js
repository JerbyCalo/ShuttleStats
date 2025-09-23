// Global helper function to get current user role
window.getCurrentUserRole = function () {
  // check if the URL has a ?user=coach parameter
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

// ShuttleStats v2 - Utilities
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
