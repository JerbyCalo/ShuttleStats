// ShuttleStats v2 - User Helper Utilities
// Shared functions for fetching user information with caching

import { db, doc, getDoc } from '../../config/firebase-config.js';

// Cache for user data to avoid repeated Firestore calls
const userCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached user data or fetch from Firestore
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
async function getCachedUser(userId) {
  if (!userId) return null;

  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userCache.set(userId, { data: userData, timestamp: Date.now() });
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Get full name from user data object
 * @param {Object} userData - User data object with name.first and name.last
 * @returns {string} Full name or empty string
 */
function formatFullName(userData) {
  if (!userData?.name) return '';
  const first = userData.name.first || '';
  const last = userData.name.last || '';
  return `${first} ${last}`.trim();
}

/**
 * Get player name by ID from Firestore (for coach mode)
 * Uses caching to minimize Firestore reads
 * @param {string} playerId - Firebase user ID of the player
 * @returns {Promise<string>} Player's full name or "Unknown Player" if not found
 */
export async function getPlayerName(playerId) {
  const userData = await getCachedUser(playerId);
  if (userData) {
    return formatFullName(userData) || 'Unknown Player';
  }
  return 'Unknown Player';
}

/**
 * Get coach name by ID from Firestore (for player mode feedback display)
 * Uses caching to minimize Firestore reads
 * @param {string} coachId - Firebase user ID of the coach
 * @returns {Promise<string>} Coach's full name or "Coach" if not found
 */
export async function getCoachName(coachId) {
  const userData = await getCachedUser(coachId);
  if (userData) {
    return formatFullName(userData) || 'Coach';
  }
  return 'Coach';
}

/**
 * Get user's full name by ID from Firestore
 * Generic version that works for any user type
 * @param {string} userId - Firebase user ID
 * @param {string} fallback - Fallback string if user not found (default: "Unknown User")
 * @returns {Promise<string>} User's full name or fallback
 */
export async function getUserFullName(userId, fallback = 'Unknown User') {
  const userData = await getCachedUser(userId);
  if (userData) {
    return formatFullName(userData) || fallback;
  }
  return fallback;
}

/**
 * Get user data by ID from Firestore
 * Returns the full user object for more detailed access
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object|null>} User data object or null if not found
 */
export async function getUserData(userId) {
  return getCachedUser(userId);
}

/**
 * Clear the user cache
 * Call this when user data is updated to ensure fresh data on next fetch
 * @param {string} [userId] - Optional specific user ID to clear, or clear all if not provided
 */
export function clearUserCache(userId = null) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

/**
 * Prefetch multiple users at once
 * Useful for batch operations to minimize sequential Firestore calls
 * @param {string[]} userIds - Array of user IDs to prefetch
 * @returns {Promise<Map<string, Object>>} Map of userId -> userData
 */
export async function prefetchUsers(userIds) {
  const results = new Map();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const userData = await getCachedUser(userId);
      if (userData) {
        results.set(userId, userData);
      }
    })
  );

  return results;
}
