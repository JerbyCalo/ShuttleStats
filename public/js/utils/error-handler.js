// ShuttleStats v2 - Centralized Error Handler
// Consistent error handling across the application

/**
 * Error codes mapping to user-friendly messages
 */
const ERROR_MESSAGES = {
  // Firebase Auth Errors
  'auth/email-already-in-use':
    'This email is already registered. Please sign in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed':
    'This sign-in method is not enabled. Please contact support.',
  'auth/weak-password':
    'Password is too weak. Please use at least 6 characters with uppercase and numbers.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email. Please sign up first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests':
    'Too many failed attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in was interrupted. Please try again.',
  'auth/popup-blocked':
    'Pop-up was blocked by your browser. Please allow pop-ups for this site.',

  // Firestore Errors
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested data was not found.',
  'already-exists': 'This item already exists.',
  'resource-exhausted': 'Too many requests. Please wait a moment and try again.',
  'failed-precondition': 'Operation cannot be performed in the current state.',
  aborted: 'Operation was cancelled. Please try again.',
  'out-of-range': 'Invalid data range provided.',
  unimplemented: 'This feature is not yet available.',
  internal: 'An internal error occurred. Please try again later.',
  unavailable: 'Service is temporarily unavailable. Please try again later.',
  'data-loss': 'Data could not be saved. Please try again.',
  unauthenticated: 'Please sign in to continue.',

  // Custom Application Errors
  'session-not-found': 'Training session not found.',
  'match-not-found': 'Match not found.',
  'goal-not-found': 'Goal not found.',
  'player-not-found': 'Player not found.',
  'coach-not-found': 'Coach not found.',
  'invalid-role': 'You do not have the required permissions for this action.',
  'validation-error': 'Please check your input and try again.',
};

/**
 * Default error messages by category
 */
const DEFAULT_MESSAGES = {
  auth: 'Authentication failed. Please try again.',
  data: 'Failed to load data. Please refresh the page.',
  save: 'Failed to save changes. Please try again.',
  delete: 'Failed to delete item. Please try again.',
  network: 'Network error. Please check your connection.',
  unknown: 'An unexpected error occurred. Please try again.',
};

/**
 * Extract error code from various error formats
 * @param {Error|Object|string} error - The error to extract code from
 * @returns {string|null} Error code or null
 */
function extractErrorCode(error) {
  if (!error) return null;

  // Firebase error format
  if (error.code) return error.code;

  // Firestore error format
  if (error.message?.includes('permission-denied')) return 'permission-denied';
  if (error.message?.includes('not-found')) return 'not-found';

  // String error
  if (typeof error === 'string') return error;

  return null;
}

/**
 * Get user-friendly error message
 * @param {Error|Object|string} error - The error object
 * @param {string} category - Error category for default message fallback
 * @returns {string} User-friendly error message
 */
function getUserFriendlyMessage(error, category = 'unknown') {
  const code = extractErrorCode(error);

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Try to use the error message if it's user-friendly
  if (
    error?.message &&
    !error.message.includes('Firebase') &&
    error.message.length < 100
  ) {
    return error.message;
  }

  return DEFAULT_MESSAGES[category] || DEFAULT_MESSAGES.unknown;
}

/**
 * Log error to console with context
 * @param {Error|Object|string} error - The error to log
 * @param {string} context - Context description
 * @param {Object} [additionalData] - Additional data to log
 */
function logError(error, context, additionalData = {}) {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    context,
    code: extractErrorCode(error),
    message: error?.message || String(error),
    stack: error?.stack,
    ...additionalData,
  };

  console.error(`[ShuttleStats Error] ${context}:`, errorDetails);

  // Future: Send to error monitoring service (Sentry, LogRocket, etc.)
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: errorDetails });
  // }
}

/**
 * Handle error with logging and user notification
 * Main entry point for error handling throughout the app
 *
 * @param {Error|Object|string} error - The error to handle
 * @param {string} context - Description of where the error occurred
 * @param {Object} [options] - Additional options
 * @param {string} [options.category] - Error category for default message ('auth', 'data', 'save', 'delete', 'network')
 * @param {boolean} [options.silent] - If true, don't show toast notification
 * @param {string} [options.customMessage] - Override the user-facing message
 * @param {Object} [options.additionalData] - Extra data to include in logs
 * @returns {string} The user-friendly error message
 */
export function handleError(error, context, options = {}) {
  const {
    category = 'unknown',
    silent = false,
    customMessage = null,
    additionalData = {},
  } = options;

  // Log the error
  logError(error, context, additionalData);

  // Get user-friendly message
  const userMessage = customMessage || getUserFriendlyMessage(error, category);

  // Show toast notification unless silent
  if (!silent && typeof showToast === 'function') {
    showToast(userMessage, 'error');
  }

  return userMessage;
}

/**
 * Create a wrapped async function with error handling
 * Useful for wrapping async operations with consistent error handling
 *
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} context - Context description for error logging
 * @param {Object} [options] - Error handling options
 * @returns {Function} Wrapped function with error handling
 */
export function withErrorHandling(asyncFn, context, options = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, context, options);
      throw error; // Re-throw so caller can handle if needed
    }
  };
}

/**
 * Safely execute an async operation with error handling
 * Returns a tuple of [result, error] similar to Go-style error handling
 *
 * @param {Promise} promise - The promise to execute
 * @param {string} context - Context description for error logging
 * @param {Object} [options] - Error handling options
 * @returns {Promise<[any, Error|null]>} Tuple of [result, error]
 */
export async function safeAsync(promise, context, options = {}) {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    handleError(error, context, options);
    return [null, error];
  }
}

/**
 * Validate required fields and throw validation error if missing
 * @param {Object} data - Data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @param {string} context - Context for error message
 * @throws {Error} If validation fails
 */
export function validateRequired(data, requiredFields, context = 'Validation') {
  const missing = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.code = 'validation-error';
    throw error;
  }
}

// Export error message maps for testing and customization
export { ERROR_MESSAGES, DEFAULT_MESSAGES };
