// ShuttleStats v2 - Toast Notification System
console.log("toast.js loaded");

(function () {
  let toastContainer = null;
  let toastCount = 0;

  // Initialize toast styles
  function initializeStyles() {
    if (document.getElementById("toast-styles")) return; // Already initialized

    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .toast {
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        position: relative;
        overflow: hidden;
      }

      .toast.show {
        transform: translateX(0);
        opacity: 1;
      }

      .toast.hiding {
        transform: translateX(100%);
        opacity: 0;
      }

      .toast-icon {
        flex-shrink: 0;
        font-size: 20px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-content {
        flex: 1;
        color: var(--text-primary);
        font-weight: 600;
      }

      .toast-close {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: background-color 0.2s ease;
        color: var(--text-secondary);
        font-size: 16px;
        padding: 0;
      }

      .toast-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 0 0 12px 12px;
        transform-origin: left center;
        animation: toast-progress 4s linear forwards;
      }

      @keyframes toast-progress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }

      /* Toast Types */
      .toast.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-color: #10b981;
        color: white;
      }

      .toast.success .toast-content {
        color: white;
      }

      .toast.success .toast-close {
        color: rgba(255, 255, 255, 0.8);
      }

      .toast.success .toast-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .toast.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border-color: #ef4444;
        color: white;
      }

      .toast.error .toast-content {
        color: white;
      }

      .toast.error .toast-close {
        color: rgba(255, 255, 255, 0.8);
      }

      .toast.error .toast-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .toast.info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-color: #3b82f6;
        color: white;
      }

      .toast.info .toast-content {
        color: white;
      }

      .toast.info .toast-close {
        color: rgba(255, 255, 255, 0.8);
      }

      .toast.info .toast-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .toast.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-color: #f59e0b;
        color: white;
      }

      .toast.warning .toast-content {
        color: white;
      }

      .toast.warning .toast-close {
        color: rgba(255, 255, 255, 0.8);
      }

      .toast.warning .toast-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .toast-container {
          top: 16px;
          right: 16px;
          left: 16px;
          max-width: none;
        }

        .toast {
          padding: 14px 16px;
          min-height: 52px;
          font-size: 13px;
        }

        .toast-icon {
          font-size: 18px;
          width: 20px;
          height: 20px;
        }

        .toast-close {
          width: 20px;
          height: 20px;
          font-size: 14px;
        }
      }

      /* Smooth stacking animation */
      .toast:nth-child(n+2) {
        margin-top: -4px;
      }
    `;

    document.head.appendChild(style);
  }

  // Create toast container if it doesn't exist
  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }
  }

  // Get icon for toast type
  function getToastIcon(type) {
    const icons = {
      success: "✅",
      error: "❌",
      info: "ℹ️",
      warning: "⚠️",
    };
    return icons[type] || icons.info;
  }

  // Create and show toast
  function showToast(message, type = "info", duration = 4000) {
    // Validate parameters
    if (!message) {
      console.warn("Toast: message is required");
      return;
    }

    if (!["success", "error", "info", "warning"].includes(type)) {
      console.warn(`Toast: invalid type "${type}". Using "info" instead.`);
      type = "info";
    }

    // Initialize styles and container
    initializeStyles();
    ensureToastContainer();

    // Create toast element
    const toast = document.createElement("div");
    const toastId = `toast-${++toastCount}`;
    toast.id = toastId;
    toast.className = `toast ${type}`;

    // Create toast content
    toast.innerHTML = `
      <div class="toast-icon">${getToastIcon(type)}</div>
      <div class="toast-content">${message}</div>
      <button class="toast-close" type="button" aria-label="Close notification">×</button>
      <div class="toast-progress"></div>
    `;

    // Add close functionality
    const closeButton = toast.querySelector(".toast-close");
    closeButton.addEventListener("click", () => {
      dismissToast(toast);
    });

    // Add to container
    toastContainer.appendChild(toast);

    // Trigger show animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Auto dismiss
    const autoRemoveTimeout = setTimeout(() => {
      dismissToast(toast);
    }, duration);

    // Store timeout for potential early removal
    toast._autoRemoveTimeout = autoRemoveTimeout;

    // Log for debugging
    console.log(`Toast shown: ${type} - ${message}`);

    return toast;
  }

  // Dismiss toast with animation
  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;

    // Clear auto-remove timeout if it exists
    if (toast._autoRemoveTimeout) {
      clearTimeout(toast._autoRemoveTimeout);
    }

    // Add hiding class for exit animation
    toast.classList.remove("show");
    toast.classList.add("hiding");

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }

      // Clean up container if empty
      if (toastContainer && toastContainer.children.length === 0) {
        if (toastContainer.parentNode) {
          toastContainer.parentNode.removeChild(toastContainer);
        }
        toastContainer = null;
      }
    }, 300);
  }

  // Dismiss all toasts
  function dismissAllToasts() {
    if (!toastContainer) return;

    const toasts = Array.from(toastContainer.querySelectorAll(".toast"));
    toasts.forEach(dismissToast);
  }

  // Utility functions for common use cases
  function showSuccess(message, duration) {
    return showToast(message, "success", duration);
  }

  function showError(message, duration) {
    return showToast(message, "error", duration);
  }

  function showInfo(message, duration) {
    return showToast(message, "info", duration);
  }

  function showWarning(message, duration) {
    return showToast(message, "warning", duration);
  }

  // Export functions to global scope
  window.showToast = showToast;
  window.showSuccess = showSuccess;
  window.showError = showError;
  window.showInfo = showInfo;
  window.showWarning = showWarning;
  window.dismissAllToasts = dismissAllToasts;

  // Also export as Toast object for organized access
  window.Toast = {
    show: showToast,
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    dismissAll: dismissAllToasts,
  };

  console.log("Toast notification system initialized");

  // Initialize styles immediately if DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeStyles);
  } else {
    initializeStyles();
  }
})();
