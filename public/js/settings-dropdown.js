// ShuttleStats - Settings Dropdown System
// Handles the settings dropdown menu in the header

(function () {
  console.log('settings-dropdown.js loaded');

  let settingsDropdown,
    userProfile,
    isDropdownOpen = false;

  /**
   * Initialize dropdown elements
   */
  function initializeElements() {
    userProfile = document.getElementById('userProfile');
    settingsDropdown = document.getElementById('settingsDropdown');

    if (!userProfile || !settingsDropdown) {
      console.warn('Settings dropdown elements not found');
      return false;
    }
    return true;
  }

  /**
   * Open the settings dropdown
   */
  function openDropdown() {
    if (!settingsDropdown) return;

    settingsDropdown.classList.add('active');
    isDropdownOpen = true;

    // Add click-outside listener
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  }

  /**
   * Close the settings dropdown
   */
  function closeDropdown() {
    if (!settingsDropdown) return;

    settingsDropdown.classList.remove('active');
    isDropdownOpen = false;

    // Remove click-outside listener
    document.removeEventListener('click', handleClickOutside);
  }

  /**
   * Toggle dropdown visibility
   */
  function toggleDropdown(event) {
    event.stopPropagation();

    if (isDropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  /**
   * Handle clicks outside the dropdown
   */
  function handleClickOutside(event) {
    // Close if click is outside both the dropdown and the user profile
    if (!settingsDropdown.contains(event.target) && !userProfile.contains(event.target)) {
      closeDropdown();
    }
  }

  /**
   * Handle clicks on the settings icon only (not the entire user profile container)
   */
  function handleSettingsIconClick(event) {
    const settingsIcon = document.querySelector('.user-icon');

    // Only toggle dropdown if the settings icon was clicked
    if (settingsIcon && settingsIcon.contains(event.target)) {
      toggleDropdown(event);
    }
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    if (!initializeElements()) return;

    // Listen for clicks on the user profile container
    // But only toggle dropdown when clicking the settings icon
    userProfile.addEventListener('click', handleSettingsIconClick);

    // Prevent dropdown clicks from closing it
    settingsDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Handle dropdown menu item clicks
    const dropdownItems = settingsDropdown.querySelectorAll('.dropdown-item');
    dropdownItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const action = item.dataset.action;

        if (action === 'logout') {
          e.preventDefault();
          handleLogout();
        } else if (action === 'profile') {
          // Navigate to profile page
          window.location.href = 'profile.html';
        } else if (action === 'notifications') {
          // For now, just close dropdown (notifications feature not implemented yet)
          closeDropdown();
          console.log('Notifications feature coming soon');
        }
      });
    });

    // Handle Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        closeDropdown();
      }
    });

    console.log('Settings dropdown event listeners set up');
  }

  /**
   * Handle logout action
   */
  function handleLogout() {
    // Close dropdown first
    closeDropdown();

    // Trigger the existing sign out functionality
    // Check if the signout button exists and trigger its click event
    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
      signoutBtn.click();
    } else {
      // Fallback: call auth-utils logout if available
      if (window.logout && typeof window.logout === 'function') {
        window.logout();
      } else {
        console.error('Logout functionality not found');
      }
    }
  }

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing settings dropdown system...');
    setupEventListeners();
  });

  // Expose functions globally for potential external use
  window.settingsDropdown = {
    open: openDropdown,
    close: closeDropdown,
    toggle: toggleDropdown,
    isOpen: () => isDropdownOpen,
  };
})();
