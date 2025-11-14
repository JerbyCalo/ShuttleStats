// ShuttleStats v2 - Timezone Utilities (GMT+8)
console.log('timezone-utils.js loaded');

/**
 * Timezone configuration for ShuttleStats
 * All dates should be handled in GMT+8 (Philippine Time)
 */
const TIMEZONE_OFFSET = 8; // GMT+8

/**
 * Get current date in GMT+8 timezone
 * @returns {Date} Date object adjusted for GMT+8
 */
export function getCurrentDateGMT8() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt8Time = new Date(utcTime + 3600000 * TIMEZONE_OFFSET);
  return gmt8Time;
}

/**
 * Convert a date string (YYYY-MM-DD) to GMT+8 Date object
 * Ensures the date is interpreted as GMT+8, not local timezone
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Date object in GMT+8
 */
export function parseDateAsGMT8(dateString) {
  if (!dateString) return null;

  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);

  // Create a date in GMT+8 (month is 0-indexed in JavaScript)
  const date = new Date(Date.UTC(year, month - 1, day, -TIMEZONE_OFFSET, 0, 0));

  return date;
}

/**
 * Format a Date object for display in GMT+8 timezone
 * @param {Date|string} date - Date object or ISO string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateGMT8(date, options = {}) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Default options for long format
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Manila', // GMT+8
  };

  const formatOptions = { ...defaultOptions, ...options };

  return dateObj.toLocaleDateString('en-US', formatOptions);
}

/**
 * Get date string in YYYY-MM-DD format for GMT+8
 * This is used for input fields and storage
 * @param {Date} date - Date object (optional, defaults to current date)
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getDateStringGMT8(date = null) {
  const dateObj = date || getCurrentDateGMT8();

  // Get the date components in GMT+8
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convert a date from storage (YYYY-MM-DD) to display format in GMT+8
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function displayDateGMT8(dateString, options = {}) {
  if (!dateString) return '';

  // Parse as GMT+8 to avoid timezone issues
  const date = parseDateAsGMT8(dateString);

  return formatDateGMT8(date, options);
}

/**
 * Get today's date in YYYY-MM-DD format (GMT+8)
 * @returns {string} Today's date
 */
export function getTodayGMT8() {
  return getDateStringGMT8(getCurrentDateGMT8());
}

/**
 * Calculate days ago from a date string (in GMT+8)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Number of days ago
 */
export function daysAgoGMT8(dateString) {
  if (!dateString) return 0;

  const date = parseDateAsGMT8(dateString);
  const today = getCurrentDateGMT8();

  const diffTime = today - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get relative time string (e.g., "Today", "1 day ago") in GMT+8
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Relative time string
 */
export function getRelativeTimeGMT8(dateString) {
  const days = daysAgoGMT8(dateString);

  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 0) return 'In the future';

  return `${days} days ago`;
}

/**
 * Compare two date strings in GMT+8
 * @param {string} dateString1 - First date in YYYY-MM-DD format
 * @param {string} dateString2 - Second date in YYYY-MM-DD format
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDatesGMT8(dateString1, dateString2) {
  const date1 = parseDateAsGMT8(dateString1);
  const date2 = parseDateAsGMT8(dateString2);

  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  return 0;
}

/**
 * Get date string for X days from now (GMT+8)
 * @param {number} days - Number of days (positive for future, negative for past)
 * @returns {string} Date in YYYY-MM-DD format
 */
export function getDateOffsetGMT8(days = 0) {
  const today = getCurrentDateGMT8();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + days);

  return getDateStringGMT8(targetDate);
}

// Log timezone info on load
console.log('Timezone utilities initialized for GMT+8 (Asia/Manila)');
console.log('Current date/time (GMT+8):', getCurrentDateGMT8().toISOString());
console.log('Today (YYYY-MM-DD):', getTodayGMT8());
