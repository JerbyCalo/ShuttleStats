// ShuttleStats v2 - Progress Page Logic
console.log("progress.js loaded");

(function () {
  // Initialize progress page when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("Progress page initializing...");

    // Check if user is a coach (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get("user");

    if (userRole === "coach") {
      // Coach view: Update page for management view
      console.log("Coach view detected - switching to management mode");

      // Update page title
      const pageTitle = document.querySelector("h1");
      if (pageTitle) {
        pageTitle.textContent = "Player Progress Management";
      }

      // Update subheading if it exists
      const subheading = document.querySelector(".subheading");
      if (subheading) {
        subheading.textContent = "Track progress for all players";
      }

      // Replace main content with coach placeholder
      const mainContent = document.querySelector("#mainContent .page-content");
      if (mainContent) {
        mainContent.innerHTML = `
          <h2>Player Progress Management</h2>
          <div style="padding: 40px; text-align: center; background: #f8f9fb; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #1211ca; margin-bottom: 16px;">📊 Coach Progress Dashboard</h3>
            <p style="color: #666; font-size: 1.1rem; margin-bottom: 16px;">
              Overview of all player progress metrics will go here.
            </p>
            <p style="color: #666; font-size: 1rem;">
              Coach can view detailed progress analytics and trends for any player.
            </p>
            <div style="margin-top: 24px; padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #1211ca;">
              <strong>Coming Soon:</strong> Progress charts, comparative analytics, team progress reports, and improvement recommendations.
            </div>
          </div>
        `;
      }
    } else {
      // Player view: Normal functionality
      console.log("Player view - loading normal progress page");

      // For now, just keep the existing content
      // Future: Add player-specific progress functionality here
    }

    console.log("Progress page initialized successfully");
  });
})();
