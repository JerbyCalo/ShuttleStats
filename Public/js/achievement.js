// ShuttleStats v2 - Achievement Page Logic
console.log("achievement.js loaded");

(function () {
  // Initialize achievement page when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("Achievement page initializing...");

    // Check if user is a coach (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get("user");

    if (userRole === "coach") {
      // Coach view: Update page for management view
      console.log("Coach view detected - switching to management mode");

      // Update page title
      const pageTitle = document.querySelector("h1");
      if (pageTitle) {
        pageTitle.textContent = "Player Achievement Management";
      }

      // Update subheading if it exists
      const subheading = document.querySelector(".subheading");
      if (subheading) {
        subheading.textContent = "Manage achievements for all players";
      }

      // Replace main content with coach placeholder
      const mainContent = document.querySelector("#mainContent .page-content");
      if (mainContent) {
        mainContent.innerHTML = `
          <h2>Player Achievement Management</h2>
          <div style="padding: 40px; text-align: center; background: #f8f9fb; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #1211ca; margin-bottom: 16px;">🏆 Coach Achievement Dashboard</h3>
            <p style="color: #666; font-size: 1.1rem; margin-bottom: 16px;">
              Overview of all player achievements will go here.
            </p>
            <p style="color: #666; font-size: 1rem;">
              Coach can view, award, and track achievements for any player.
            </p>
            <div style="margin-top: 24px; padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #1211ca;">
              <strong>Coming Soon:</strong> Achievement templates, milestone tracking, team achievement rankings, and custom badge creation.
            </div>
          </div>
        `;
      }
    } else {
      // Player view: Normal functionality
      console.log("Player view - loading normal achievement page");

      // For now, just keep the existing content
      // Future: Add player-specific achievement functionality here
    }

    console.log("Achievement page initialized successfully");
  });
})();
