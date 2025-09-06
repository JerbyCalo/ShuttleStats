// ShuttleStats v2 - Loading States System
console.log("loading.js loaded");

(function () {
  // Loading state management
  const loadingStates = new Map();

  /**
   * Show loading spinner in a container
   * @param {string} containerId - The ID of the container to show loading in
   * @param {Object} options - Configuration options
   * @param {string} options.text - Loading text to display
   * @param {string} options.size - Spinner size: 'small', 'normal', 'large'
   * @param {boolean} options.overlay - Whether to show overlay background
   * @param {boolean} options.global - Whether to show as global (fixed) or local (absolute)
   */
  window.showLoadingSpinner = function (containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    // Default options
    const config = {
      text: options.text || "Loading...",
      size: options.size || "normal",
      overlay: options.overlay !== false, // default to true
      global: options.global || false, // default to component-level loading
      ...options,
    };

    // Ensure container has relative positioning for absolute spinner
    if (!config.global) {
      const computedStyle = window.getComputedStyle(container);
      if (computedStyle.position === "static") {
        container.style.position = "relative";
      }
    }

    // Add loading class to container
    container.classList.add("loading");

    // Create spinner container if it doesn't exist
    let spinnerContainer = container.querySelector(
      ".loading-spinner-container"
    );
    if (!spinnerContainer) {
      spinnerContainer = document.createElement("div");
      spinnerContainer.className = config.global
        ? "loading-spinner-container global-loading-spinner"
        : "loading-spinner-container component-loading-spinner";

      if (config.global) {
        document.body.appendChild(spinnerContainer);
      } else {
        container.appendChild(spinnerContainer);
      }
    }

    // Get spinner size class
    let sizeClass = "";
    switch (config.size) {
      case "small":
        sizeClass = "loading-spinner-small";
        break;
      case "large":
        sizeClass = "loading-spinner-large";
        break;
      default:
        sizeClass = "";
    }

    // Create spinner HTML
    spinnerContainer.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner ${sizeClass}"></div>
        ${config.text ? `<div class="loading-text">${config.text}</div>` : ""}
      </div>
    `;

    // Show the spinner
    spinnerContainer.classList.add("show");

    // Track loading state
    loadingStates.set(containerId, {
      container,
      spinnerContainer,
      startTime: Date.now(),
      isGlobal: config.global,
    });

    console.log(
      `Loading spinner shown for container: ${containerId} (${
        config.global ? "global" : "component"
      })`
    );
  };

  /**
   * Hide loading spinner from a container
   * @param {string} containerId - The ID of the container to hide loading from
   */
  window.hideLoadingSpinner = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    // Remove loading class
    container.classList.remove("loading");

    const loadingState = loadingStates.get(containerId);
    if (!loadingState) {
      console.warn(`No loading state found for container: ${containerId}`);
      return;
    }

    const { spinnerContainer, isGlobal } = loadingState;

    if (spinnerContainer) {
      spinnerContainer.classList.remove("show");
      // Clean up after animation
      setTimeout(() => {
        if (spinnerContainer.parentNode) {
          spinnerContainer.remove();
        }
      }, 300);
    }

    // Calculate loading time for debugging
    const loadingTime = Date.now() - loadingState.startTime;
    console.log(
      `Loading spinner hidden for container: ${containerId} (${loadingTime}ms)`
    );
    loadingStates.delete(containerId);
  };

  /**
   * Show global loading spinner (covers entire screen)
   * @param {Object} options - Configuration options
   */
  window.showGlobalLoader = function (options = {}) {
    showLoadingSpinner("body", { ...options, global: true });
  };

  /**
   * Hide global loading spinner
   */
  window.hideGlobalLoader = function () {
    hideLoadingSpinner("body");
  };

  /**
   * Show local loading spinner (contained within component)
   * @param {string} containerId - Container ID
   * @param {Object} options - Configuration options
   */
  window.showLocalLoader = function (containerId, options = {}) {
    showLoadingSpinner(containerId, { ...options, global: false });
  };

  /**
   * Show skeleton loading state
   * @param {string} containerId - Container to show skeleton in
   * @param {number} count - Number of skeleton items to show
   * @param {string} type - Type of skeleton: 'card', 'list', 'text'
   */
  window.showSkeletonLoading = function (
    containerId,
    count = 3,
    type = "card"
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    // Clear existing content
    container.innerHTML = "";

    // Generate skeleton items
    for (let i = 0; i < count; i++) {
      const skeletonItem = createSkeletonItem(type);
      container.appendChild(skeletonItem);
    }

    console.log(`Skeleton loading shown for container: ${containerId}`);
  };

  /**
   * Create a skeleton loading item
   * @param {string} type - Type of skeleton item
   * @returns {HTMLElement} Skeleton element
   */
  function createSkeletonItem(type) {
    const item = document.createElement("div");

    switch (type) {
      case "card":
        item.className = "skeleton-card";
        item.innerHTML = `
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        `;
        break;

      case "list":
        item.className = "skeleton-list-item";
        item.style.cssText = "padding: 1rem 0; border-bottom: 1px solid #eee;";
        item.innerHTML = `
          <div class="skeleton skeleton-text" style="margin-bottom: 0.5rem;"></div>
          <div class="skeleton skeleton-text short"></div>
        `;
        break;

      case "text":
        item.className = "skeleton-text-block";
        item.innerHTML = `
          <div class="skeleton skeleton-text"></div>
        `;
        break;

      default:
        item.innerHTML = `<div class="skeleton skeleton-text"></div>`;
    }

    return item;
  }

  /**
   * Simulate network delay for development
   * @param {number} delay - Delay in milliseconds (default: 800ms)
   * @returns {Promise} Promise that resolves after delay
   */
  window.simulateNetworkDelay = function (delay = 800) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  };

  /**
   * Show loading state on button
   * @param {string|HTMLElement} buttonElement - Button element or selector
   * @param {string} loadingText - Optional loading text
   */
  window.showButtonLoading = function (buttonElement, loadingText = null) {
    const button =
      typeof buttonElement === "string"
        ? document.querySelector(buttonElement)
        : buttonElement;

    if (!button) {
      console.error("Button element not found");
      return;
    }

    button.classList.add("loading");
    button.disabled = true;

    if (loadingText) {
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
    }

    console.log("Button loading state activated");
  };

  /**
   * Hide loading state on button
   * @param {string|HTMLElement} buttonElement - Button element or selector
   */
  window.hideButtonLoading = function (buttonElement) {
    const button =
      typeof buttonElement === "string"
        ? document.querySelector(buttonElement)
        : buttonElement;

    if (!button) {
      console.error("Button element not found");
      return;
    }

    button.classList.remove("loading");
    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }

    console.log("Button loading state removed");
  };

  /**
   * Show empty state in container
   * @param {string} containerId - Container ID
   * @param {Object} options - Configuration options
   * @param {string} options.icon - Icon to display
   * @param {string} options.title - Title text
   * @param {string} options.message - Message text
   * @param {string} options.actionText - Action button text
   * @param {Function} options.onAction - Action button callback
   */
  window.showEmptyState = function (containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    const config = {
      icon: options.icon || "📋",
      title: options.title || "No Data Found",
      message: options.message || "",
      actionText: options.actionText || null,
      onAction: options.onAction || null,
    };

    const actionButton = config.actionText
      ? `<button class="btn btn-primary" onclick="(${config.onAction})()" style="margin-top: 1rem;">
           ${config.actionText}
         </button>`
      : "";

    container.innerHTML = `
      <div class="no-data">
        <div class="no-data-icon">${config.icon}</div>
        <h3>${config.title}</h3>
        <p>${config.message}</p>
        ${actionButton}
      </div>
    `;

    console.log(`Empty state shown for container: ${containerId}`);
  };

  /**
   * Utility function to wrap async operations with loading states
   * @param {string} containerId - Container to show loading in
   * @param {Function} asyncFunction - Async function to execute
   * @param {Object} options - Loading options
   * @returns {Promise} Promise from the async function
   */
  window.withLoadingState = async function (
    containerId,
    asyncFunction,
    options = {}
  ) {
    try {
      showLoadingSpinner(containerId, options);
      const result = await asyncFunction();
      return result;
    } catch (error) {
      console.error("Error in async operation:", error);
      throw error;
    } finally {
      hideLoadingSpinner(containerId);
    }
  };

  // Export loading utilities for global access
  window.LoadingUtils = {
    showSpinner: window.showLoadingSpinner,
    hideSpinner: window.hideLoadingSpinner,
    showSkeleton: window.showSkeletonLoading,
    showEmpty: window.showEmptyState,
    simulateDelay: window.simulateNetworkDelay,
    withLoading: window.withLoadingState,
  };

  console.log("Loading system initialized successfully");
})();
