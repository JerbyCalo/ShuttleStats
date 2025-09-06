// ShuttleStats v2 - Navigation System (Hamburger Menu)
console.log("navigation.js loaded");

(function () {
  let sidebar, sidebarOverlay, hamburgerBtn, sidebarClose;
  let isOpen = false;

  function initializeElements() {
    sidebar = document.getElementById("sidebar");
    sidebarOverlay = document.getElementById("sidebarOverlay");
    hamburgerBtn = document.getElementById("hamburgerBtn");
    sidebarClose = document.getElementById("sidebarClose");

    if (!sidebar || !sidebarOverlay || !hamburgerBtn || !sidebarClose) {
      console.warn("Navigation elements not found");
      return false;
    }
    return true;
  }

  function openSidebar() {
    if (!sidebar || !sidebarOverlay || !hamburgerBtn) return;

    console.log("Opening sidebar");
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    hamburgerBtn.classList.add("sidebar-open"); // Move hamburger icon
    isOpen = true;

    // Prevent body scroll when sidebar is open
    document.body.style.overflow = "hidden";

    // Add click-outside-to-close listener to main content
    setTimeout(() => {
      const mainContent = document.getElementById("mainContent");
      if (mainContent) {
        mainContent.addEventListener("click", handleMainContentClick);
      }
    }, 100); // Small delay to prevent immediate closure

    // Focus first nav link for accessibility
    const firstNavLink = sidebar.querySelector(".nav-link");
    if (firstNavLink) {
      setTimeout(() => firstNavLink.focus(), 300);
    }
  }

  function closeSidebar() {
    if (!sidebar || !sidebarOverlay || !hamburgerBtn) return;

    console.log("Closing sidebar");
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    hamburgerBtn.classList.remove("sidebar-open"); // Move hamburger icon back
    isOpen = false;

    // Restore body scroll
    document.body.style.overflow = "";

    // Remove click-outside-to-close listener from main content
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.removeEventListener("click", handleMainContentClick);
    }

    // Return focus to hamburger button
    if (hamburgerBtn) {
      hamburgerBtn.focus();
    }
  }

  function handleMainContentClick(event) {
    // Only close if sidebar is open and click is not on hamburger button
    if (isOpen && !hamburgerBtn.contains(event.target)) {
      event.stopPropagation();
      closeSidebar();
    }
  }

  function toggleSidebar() {
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function handleKeydown(event) {
    // Close sidebar on Escape key
    if (event.key === "Escape" && isOpen) {
      closeSidebar();
    }
  }

  function setupEventListeners() {
    if (!initializeElements()) return;

    // Hamburger button click
    hamburgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSidebar();
    });

    // Close button click
    sidebarClose.addEventListener("click", closeSidebar);

    // Overlay click
    sidebarOverlay.addEventListener("click", closeSidebar);

    // Navigation link clicks (role-aware navigation)
    const navLinks = sidebar.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        // Special handling for sign-out button - should never have role parameters
        if (
          link.id === "signout-btn" ||
          link.textContent.trim().toLowerCase().includes("sign out")
        ) {
          setTimeout(closeSidebar, 200);
          return;
        }

        // Don't close if it's the Dashboard link (current page)
        if (!link.textContent.trim().includes("Dashboard")) {
          // If the user is a coach, modify the link to indicate that
          if (getCurrentUserRole() === "coach") {
            // Don't navigate immediately
            e.preventDefault();

            // Create a new URL with the user role parameter
            const newUrl = new URL(link.href, window.location.origin);
            newUrl.searchParams.set("user", "coach");

            // Navigate to the new URL
            window.location.href = newUrl.toString();
          } else {
            // Existing logic for players: just close sidebar after a delay
            setTimeout(closeSidebar, 200);
          }
        }
      });
    });

    // Keyboard support
    document.addEventListener("keydown", handleKeydown);

    // Prevent sidebar clicks from closing it
    sidebar.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    console.log("Navigation event listeners set up");
  }

  // Auto-initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing navigation system...");
    setupEventListeners();
  });

  // Expose functions globally for potential external use
  window.navigationSystem = {
    openSidebar,
    closeSidebar,
    toggleSidebar,
    isOpen: () => isOpen,
  };
})();
