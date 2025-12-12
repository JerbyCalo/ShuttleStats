// ShuttleStats v2 - Matches Page Logic
console.log('matches.js loaded');

// Import Firebase functions for Match operations
import {
  db,
  auth,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  limit,
  addDoc,
  serverTimestamp,
} from '../config/firebase-config.js';

// Import authentication utilities for better role detection
import { checkAuthenticationState } from './auth-utils.js';

// Import timezone utilities for GMT+8 handling
import { displayDateGMT8 } from './timezone-utils.js';

// Import shared user helper utilities
import { getPlayerName, getCoachName } from './utils/user-helpers.js';

// Import centralized error handler
import { handleError } from './utils/error-handler.js';

(function () {
  // Track if we're in coach mode
  let isCoachMode = false;
  let currentFilteredData = [];

  /**
   * Format date to readable string using GMT+8 timezone
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string} Formatted date string with weekday, month, day, and year
   */
  function formatDate(dateString) {
    return displayDateGMT8(dateString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get CSS class for result badge based on match outcome
   * @param {string} result - Match result ('win', 'loss', or 'draw')
   * @returns {string} CSS class name for the result badge
   */
  function getResultClass(result) {
    if (typeof result !== 'string') return 'result-loss';
    switch (result.toLowerCase()) {
      case 'win':
        return 'result-win';
      case 'loss':
        return 'result-loss';
      default:
        return 'result-loss';
    }
  }

  /**
   * Format score display from match data
   * Combines all game scores (up to 3 games) into a readable format
   * @param {Object} match - Match data object containing score fields
   * @returns {string} Formatted score string (e.g., "21-18, 21-19")
   */
  function formatScore(match) {
    let scoreText = `${match.yourScore}-${match.opponentScore}`;
    if (match.yourScore2 !== undefined) {
      scoreText += `, ${match.yourScore2}-${match.opponentScore2}`;
    }
    if (match.yourScore3 !== undefined) {
      scoreText += `, ${match.yourScore3}-${match.opponentScore3}`;
    }
    return scoreText;
  }

  // Note: getPlayerName and getCoachName are now imported from utils/user-helpers.js
  // They include caching for better performance

  /**
   * Submit feedback for a match (coach only)
   * Creates a new feedback document in Firestore and updates the UI
   * @param {string} matchId - Firestore document ID of the match
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async function submitMatchFeedback(matchId) {
    const currentUserId = sessionStorage.getItem('currentUserId');
    const currentUserRole = sessionStorage.getItem('userRole');

    if (!currentUserId || currentUserRole !== 'coach') {
      console.error('Only coaches can submit feedback');
      return false;
    }

    const feedbackTextarea = document.querySelector(
      `[data-match-feedback-session-id="${matchId}"] .feedback-textarea`
    );
    const submitBtn = document.querySelector(
      `[data-match-feedback-session-id="${matchId}"] .feedback-submit-btn`
    );

    if (!feedbackTextarea || !feedbackTextarea.value.trim()) {
      if (typeof showToast === 'function') {
        showToast('Please enter feedback before submitting', 'error');
      }
      return false;
    }

    const feedbackText = feedbackTextarea.value.trim();

    // Get match data to find playerId
    try {
      const matchDoc = await getDoc(doc(db, 'matches', matchId));
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }

      const matchData = matchDoc.data();

      // Disable submit button during submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      // Create feedback document
      const feedbackData = {
        matchId: matchId, // Using matchId instead of trainingSessionId
        coachId: currentUserId,
        playerId: matchData.playerId,
        content: feedbackText,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Submitting match feedback data:', feedbackData);
      await addDoc(collection(db, 'feedback'), feedbackData);

      // Clear textarea and show success message
      feedbackTextarea.value = '';

      if (typeof showToast === 'function') {
        showToast('Match feedback submitted successfully!', 'success');
      }

      console.log('Match feedback submitted for match:', matchId);
      return true;
    } catch (error) {
      console.error('Error submitting match feedback:', error);

      if (typeof showToast === 'function') {
        showToast('Failed to submit feedback. Please try again.', 'error');
      }

      return false;
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback';
    }
  }

  // Load and display feedback for a match
  async function loadMatchFeedback(matchId, containerElement) {
    if (!containerElement) {
      console.error('No container element provided for feedback display');
      return;
    }

    try {
      const q = query(
        collection(db, 'feedback'),
        where('matchId', '==', matchId),
        where('playerId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const feedbackItems = [];

      for (const doc of querySnapshot.docs) {
        const feedbackData = { id: doc.id, ...doc.data() };
        const coachName = await getCoachName(feedbackData.coachId);

        feedbackItems.push({
          ...feedbackData,
          coachName: coachName,
        });
      }

      // Clear existing content
      containerElement.innerHTML = '';

      if (feedbackItems.length === 0) {
        containerElement.innerHTML = `
          <div class="no-feedback">
            No feedback available for this match yet.
          </div>
        `;
        return;
      }

      // Render feedback items
      feedbackItems.forEach((feedback) => {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback-item';

        // Format date
        let feedbackDate = 'Recently';
        if (feedback.createdAt && feedback.createdAt.toDate) {
          feedbackDate = feedback.createdAt.toDate().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        feedbackElement.innerHTML = `
          <div class="feedback-meta">
            <span class="feedback-coach">Coach ${feedback.coachName}</span>
            <span class="feedback-date">${feedbackDate}</span>
          </div>
          <div class="feedback-content">${feedback.content}</div>
        `;

        containerElement.appendChild(feedbackElement);
      });
    } catch (error) {
      console.error('Error loading match feedback:', error);
      containerElement.innerHTML = `
        <div class="no-feedback">
          Unable to load feedback. Please try again later.
        </div>
      `;
    }
  }

  // Set up real-time listener for match feedback updates (for players)
  function setupMatchFeedbackListener(matchId, containerElement) {
    if (!containerElement) return;

    try {
      const q = query(
        collection(db, 'feedback'),
        where('matchId', '==', matchId),
        where('playerId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          console.log('Real-time match feedback update received for match:', matchId);

          // Reload feedback when changes occur
          await loadMatchFeedback(matchId, containerElement);
        },
        (error) => {
          console.error('Error in match feedback listener:', error);
        }
      );

      // Store the unsubscribe function for cleanup
      if (!containerElement.feedbackListener) {
        containerElement.feedbackListener = unsubscribe;
      }
    } catch (error) {
      console.error('Error setting up match feedback listener:', error);
    }
  }

  // Create match card
  async function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.matchId = match.id;

    // Get current user role from session storage or window.currentUserData
    let currentUserRole = sessionStorage.getItem('userRole');
    if (!currentUserRole && window.currentUserData) {
      currentUserRole = window.currentUserData.role;
    }

    // For coach mode, add player name to the header
    let playerInfo = '';
    if (isCoachMode) {
      const playerName = await getPlayerName(match.playerId);
      playerInfo = `<div class="player-info" style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;">
        👤 ${playerName}
       </div>`;
    }

    // Create feedback section based on user role
    let feedbackSection = '';
    if (currentUserRole === 'coach') {
      // Coach feedback form
      feedbackSection = `
        <div class="feedback-section" data-match-feedback-session-id="${match.id}">
          <div class="feedback-form">
            <div class="feedback-form-header">
              <span>💬</span>
              <span>Add Match Feedback for Player</span>
            </div>
            <textarea 
              class="feedback-textarea" 
              placeholder="Provide detailed feedback about this match performance..."
              rows="3"
            ></textarea>
            <button type="button" class="feedback-submit-btn">
              Submit Feedback
            </button>
          </div>
        </div>
      `;
    } else if (currentUserRole === 'player') {
      // Player feedback display
      feedbackSection = `
        <div class="feedback-section">
          <div class="feedback-display">
            <div class="feedback-display-header">
              <span>💬</span>
              <span>Coach Feedback</span>
            </div>
            <div class="feedback-items" data-match-feedback-display="${match.id}">
              <!-- Feedback items will be loaded here -->
            </div>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      ${playerInfo}
      <div class="match-card-header">
        <div class="match-date">
          <div class="date-main">${formatDate(match.date)}</div>
          <div class="date-sub">${match.duration} minutes</div>
        </div>
        <div class="match-result">
          <span class="type-badge">${match.matchType}</span>
          <span class="result-badge ${getResultClass(match.result)}">${
            match.result
          }</span>
        </div>
      </div>
      
      <div class="match-card-content">
        <div class="match-opponent">
          <span class="opponent-icon">🏸</span>
          <span class="opponent-name">vs ${match.opponent}</span>
        </div>
        
        <div class="match-score">
          <strong>Score:</strong>
          <div class="score-display">
            <span class="score-text">${formatScore(match)}</span>
          </div>
        </div>
        
        <div class="match-notes">
          <strong>Match Notes:</strong>
          <p class="notes-text">${match.notes}</p>
        </div>
      </div>
      
      <div class="match-card-actions">
        ${(() => {
          // Only players can edit/delete their own matches
          // Coaches get read-only view regardless of their involvement
          const currentUserId = sessionStorage.getItem('currentUserId');

          if (currentUserRole === 'player' && currentUserId === match.playerId) {
            // Players can edit/delete their own matches
            return `
              <button class="action-btn edit-btn" data-action="edit" data-match-id="${match.id}" title="Edit Match">
                <span class="btn-icon">✏️</span>
                <span class="btn-text">Edit</span>
              </button>
              <button class="action-btn delete-btn" data-action="delete" data-match-id="${match.id}" title="Delete Match">
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">Delete</span>
              </button>
            `;
          } else {
            // Read-only view for coaches and other users
            return `
              <div class="read-only-indicator" style="color: var(--muted); font-style: italic; padding: 8px;">
              </div>
            `;
          }
        })()}
      </div>
      ${feedbackSection}
    `;

    // After creating the card, set up event listeners and load data based on role
    setTimeout(async () => {
      if (currentUserRole === 'coach') {
        // Add event listener for feedback submission
        const feedbackForm = card.querySelector(
          `[data-match-feedback-session-id="${match.id}"]`
        );
        const submitBtn = feedbackForm?.querySelector('.feedback-submit-btn');

        if (submitBtn) {
          submitBtn.addEventListener('click', async () => {
            await submitMatchFeedback(match.id);
          });
        }
      } else if (currentUserRole === 'player') {
        // Load existing feedback for players and set up real-time listener
        const feedbackDisplay = card.querySelector(
          `[data-match-feedback-display="${match.id}"]`
        );
        if (feedbackDisplay) {
          await loadMatchFeedback(match.id, feedbackDisplay);
          setupMatchFeedbackListener(match.id, feedbackDisplay);
        }
      }
    }, 0);

    return card;
  }

  // Fetch matches from Firestore (Player View)
  async function fetchPlayerMatches(userId) {
    if (!userId) {
      console.warn('No user ID provided for fetching matches');
      return [];
    }

    try {
      const q = query(
        collection(db, 'matches'),
        where('playerId', '==', userId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const matches = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Fetched ${matches.length} matches for player ${userId}`);
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  // Fetch matches from Firestore (Coach View)
  async function fetchCoachMatches(coachId, playerId = null) {
    if (!coachId) {
      console.warn('No coach ID provided for fetching matches');
      return [];
    }

    try {
      let q;
      if (playerId && playerId !== '') {
        // Filter by specific player (no more "all" option)
        q = query(
          collection(db, 'matches'),
          where('coachId', '==', coachId),
          where('playerId', '==', playerId),
          orderBy('date', 'desc')
        );
      } else {
        // If no specific player is provided, return empty array
        console.log('No player selected, returning empty array');
        return [];
      }

      const querySnapshot = await getDocs(q);
      const matches = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(
        `Fetched ${matches.length} matches for coach ${coachId} (player: ${playerId})`
      );
      return matches;
    } catch (error) {
      console.error('Error fetching coach matches:', error);
      throw error;
    }
  }

  // Filter matches data by player ID (for coach mode) - Updated to use Firestore data
  async function filterMatchesData(playerId) {
    const currentUserId = sessionStorage.getItem('currentUserId');
    if (!currentUserId) {
      console.warn('No authenticated user for filtering matches data');
      return [];
    }

    try {
      if (isCoachMode) {
        // Coach mode: fetch from Firestore
        return await fetchCoachMatches(currentUserId, playerId);
      } else {
        // Player mode: fetch user's own matches
        return await fetchPlayerMatches(currentUserId);
      }
    } catch (error) {
      console.error('Error filtering matches data:', error);
      return [];
    }
  }

  // Update match statistics (works with Firestore data)
  function updateMatchStats(dataToUse = []) {
    const totalMatchesEl = document.getElementById('totalMatches');
    const winRateEl = document.getElementById('winRate');

    if (!dataToUse || dataToUse.length === 0) {
      if (totalMatchesEl) totalMatchesEl.textContent = '0';
      if (winRateEl) winRateEl.textContent = '0%';
      return;
    }

    const totalMatches = dataToUse.length;
    const wins = dataToUse.filter(
      (match) => match.result && match.result.toLowerCase() === 'win'
    ).length;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    if (totalMatchesEl) totalMatchesEl.textContent = totalMatches;
    if (winRateEl) winRateEl.textContent = `${winRate}%`;

    console.log(`Stats updated: ${totalMatches} matches, ${winRate}% win rate`);
  }

  // Centralized function to load matches
  window.loadMatches = async function () {
    console.log('Loading matches...');

    const container = document.getElementById('matchesContainer');
    if (!container) {
      console.error('Matches container not found');
      return;
    }

    // Show loading spinner
    showLocalLoader('matchesContainer', {
      text: 'Loading matches...',
      size: 'normal',
    });

    try {
      const currentUserId = sessionStorage.getItem('currentUserId');
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      let dataToRender;

      if (isCoachMode) {
        // Coach mode: use current filtered data or fetch all
        const dropdown = document.getElementById('playerFilterDropdown');
        const selectedPlayerId = dropdown ? dropdown.value : '';
        dataToRender = await fetchCoachMatches(currentUserId, selectedPlayerId);
      } else {
        // Player mode: fetch user's own matches
        dataToRender = await fetchPlayerMatches(currentUserId);
      }

      // Clear existing content after loading
      container.innerHTML = '';

      // Hide loading spinner
      hideLoadingSpinner('matchesContainer');

      // Check if we have match data
      if (!dataToRender || dataToRender.length === 0) {
        const emptyMessage = isCoachMode ? '' : '';

        showEmptyState('matchesContainer', {
          icon: '🏆',
          title: 'No Matches Recorded',
          message: emptyMessage,
          actionText: '+ Record Match',
          onAction: () => {
            if (window.openRecordMatchModal) {
              window.openRecordMatchModal();
            }
          },
        });

        updateMatchStats(dataToRender);
        return;
      }

      // Sort matches by date (newest first) - data should already be sorted from Firestore
      const sortedMatches = [...dataToRender];

      // Create and append match cards (now async)
      for (const match of sortedMatches) {
        const card = await createMatchCard(match);
        container.appendChild(card);
      }

      // Update statistics
      updateMatchStats(dataToRender);

      console.log(`Loaded and rendered ${sortedMatches.length} matches`);
    } catch (error) {
      console.error('Error loading matches:', error);
      hideLoadingSpinner('matchesContainer');

      showEmptyState('matchesContainer', {
        icon: '⚠️',
        title: 'Error Loading Matches',
        message:
          error.message === 'User not authenticated'
            ? 'Please log in to view your matches.'
            : 'Unable to load matches. Please try refreshing the page.',
      });
    }
  };

  // Render all matches (works with filtered data in coach mode)
  async function renderMatches(matchesData = null) {
    const container = document.getElementById('matchesContainer');

    if (!container) {
      console.error('Matches container not found');
      return;
    }

    // Show loading spinner
    showLocalLoader('matchesContainer', {
      text: 'Loading matches...',
      size: 'normal',
    });

    try {
      // Simulate network delay
      await simulateNetworkDelay(800);

      // Clear existing content after loading
      container.innerHTML = '';

      // Use provided data or determine which data to use
      let dataToRender;
      if (matchesData !== null) {
        dataToRender = matchesData;
      } else {
        dataToRender = isCoachMode ? currentFilteredData : window.mockMatchesData;
      }

      // Hide loading spinner
      hideLoadingSpinner('matchesContainer');

      // Check if we have match data
      if (!dataToRender || dataToRender.length === 0) {
        const emptyMessage = isCoachMode
          ? 'No matches found for the selected player.'
          : 'No matches recorded yet. Start recording your matches to see them here.';

        showEmptyState('matchesContainer', {
          icon: '🏆',
          title: 'No Matches Recorded',
          message: emptyMessage,
          actionText: '+ Record Match',
          onAction: () => {
            if (window.openRecordMatchModal) {
              window.openRecordMatchModal();
            }
          },
        });

        updateMatchStats(dataToRender);
        return;
      }

      // Sort matches by date (newest first)
      const sortedMatches = [...dataToRender].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      // Create and append match cards (now async)
      for (const match of sortedMatches) {
        const card = await createMatchCard(match);
        container.appendChild(card);
      }

      // Update statistics
      updateMatchStats(dataToRender);

      console.log(`Rendered ${sortedMatches.length} matches`);
    } catch (error) {
      console.error('Error rendering matches:', error);
      hideLoadingSpinner('matchesContainer');

      showEmptyState('matchesContainer', {
        icon: '⚠️',
        title: 'Error Loading Matches',
        message: 'Unable to load matches. Please try refreshing the page.',
      });
    }
  }

  // Create and inject player filter dropdown (coach mode only) - Updated for Firestore
  async function createPlayerFilterDropdown() {
    if (!isCoachMode) {
      return;
    }

    const currentUserId = sessionStorage.getItem('currentUserId');
    if (!currentUserId) {
      console.error('No authenticated user for player dropdown');
      return;
    }

    try {
      // Create dropdown container
      const filterContainer = document.createElement('div');
      filterContainer.style.cssText = `
        margin: 20px 0;
        padding: 20px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;

      // Create label
      const label = document.createElement('label');
      label.htmlFor = 'playerFilterDropdown';
      label.textContent = 'Filter by Player:';
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--text);
        font-size: 1rem;
      `;

      // Create dropdown
      const dropdown = document.createElement('select');
      dropdown.id = 'playerFilterDropdown';
      dropdown.className = 'form-control';
      dropdown.style.cssText = `
        width: 100%;
        max-width: 300px;
        padding: 12px 16px;
        border: 2px solid var(--border);
        border-radius: 8px;
        font-size: 1rem;
        background: var(--card);
        color: var(--text);
        cursor: pointer;
        transition: border-color 0.3s ease;
      `;

      // Clear existing options (REMOVE "All Players" option)
      dropdown.innerHTML = '';

      // Fetch coach's players from Firestore
      const coachPlayersQuery = query(
        collection(db, 'coach_players'),
        where('coachId', '==', currentUserId),
        where('status', '==', 'accepted')
      );

      const querySnapshot = await getDocs(coachPlayersQuery);

      if (querySnapshot.empty) {
        // Show "No Players" message
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No Players Found';
        dropdown.appendChild(option);
        return;
      }

      // Collect players data
      const players = [];
      for (const relationshipDoc of querySnapshot.docs) {
        const relationship = relationshipDoc.data();
        try {
          // Fetch player details - Fixed: Use proper doc reference
          console.log('Fetching player doc for ID:', relationship.playerId);
          console.log('doc function exists:', typeof doc);
          console.log('db exists:', typeof db);

          const playerDocRef = doc(db, 'users', relationship.playerId);
          console.log('playerDocRef created successfully:', playerDocRef);

          const playerDoc = await getDoc(playerDocRef);
          console.log('playerDoc fetched successfully:', playerDoc.exists());

          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            players.push({
              id: relationship.playerId,
              name: `${playerData.name.first} ${playerData.name.last}`.trim(),
            });
          }
        } catch (error) {
          console.error('Error fetching player details:', error);
        }
      }

      // Populate dropdown with players only (NO "All Players" option)
      players.forEach((player) => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = player.name;
        dropdown.appendChild(option);
      });

      // Automatically select the first player and load their data
      if (players.length > 0) {
        dropdown.value = players[0].id;
        console.log(`Auto-selected first player: ${players[0].name}`);

        // Load data for the first player immediately
        setTimeout(async () => {
          await window.loadMatches();
        }, 100);
      }

      // Add event listener for filtering
      dropdown.addEventListener('change', async function () {
        const selectedPlayerId = this.value;
        console.log(`Filtering matches data for player: ${selectedPlayerId}`);

        // Use the centralized function to reload data
        await window.loadMatches();
      });

      // Assemble the filter container
      filterContainer.appendChild(label);
      filterContainer.appendChild(dropdown);

      // Find the action bar and insert the filter before it
      const actionBar = document.querySelector('.action-bar');
      if (actionBar && actionBar.parentNode) {
        actionBar.parentNode.insertBefore(filterContainer, actionBar);
      }

      console.log('Player filter dropdown created with Firestore data');
    } catch (error) {
      console.error('Error creating player filter dropdown:', error);

      // Show error message
      if (typeof showToast === 'function') {
        showToast('Failed to load player list', 'error');
      }
    }
  }

  // Set up coach mode UI transformations
  function setupCoachMode() {
    console.log('Setting up coach mode UI...');

    // Update page title
    const pageTitle = document.querySelector('.page-title h1');
    if (pageTitle) {
      pageTitle.textContent = 'Manage Matches';
    }

    // Update subheading
    const subheading = document.querySelector('.page-title .subheading');
    if (subheading) {
      subheading.textContent = 'Manage matches for all players';
    }

    // Create and inject player filter dropdown
    createPlayerFilterDropdown();

    console.log('Coach mode UI setup complete');
  }

  // Set up event delegation for edit and delete buttons
  function setupEventDelegation() {
    const matchesContainer = document.getElementById('matchesContainer');

    if (matchesContainer) {
      matchesContainer.addEventListener('click', function (event) {
        const target = event.target;
        let button = null;

        // Check if clicked element is a button or a child of a button
        if (target.classList.contains('action-btn')) {
          button = target;
        } else if (target.closest('.action-btn')) {
          button = target.closest('.action-btn');
        }

        if (button) {
          const action = button.dataset.action;
          const matchId = button.dataset.matchId;

          if (action === 'edit' && matchId) {
            console.log('Edit button clicked for match:', matchId);
            window.editMatch(matchId);
          } else if (action === 'delete' && matchId) {
            console.log('Delete button clicked for match:', matchId);
            window.deleteMatch(matchId);
          }
        }
      });

      console.log('Event delegation set up for match card actions');
    } else {
      console.warn('Matches container not found for event delegation');
    }
  }

  // Set up "Add New Match" button
  function setupAddMatchButton() {
    const addButton = document.getElementById('addMatchBtn');

    if (addButton) {
      addButton.addEventListener('click', function () {
        console.log('Opening match modal');

        // Check if modal function exists (from modals.js)
        if (window.openRecordMatchModal) {
          window.openRecordMatchModal();
        } else {
          console.warn('Match modal function not available');
          alert('Match modal will be available when modals.js is loaded');
        }
      });

      console.log('Add match button set up');
    } else {
      console.warn('Add match button not found');
    }
  }

  // Delete match from Firestore
  window.deleteMatch = async function (matchId) {
    // Confirm deletion
    if (
      !confirm(
        'Are you sure you want to delete this match? This action cannot be undone.'
      )
    ) {
      return;
    }

    const currentUserId = sessionStorage.getItem('currentUserId');
    if (!currentUserId) {
      alert('Error: You must be logged in to delete matches.');
      return;
    }

    // Find the match card and show loading state
    const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
    if (matchCard) {
      showLocalLoader(matchCard.id || 'match-card', {
        text: 'Deleting match...',
        size: 'small',
      });
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'matches', matchId));

      console.log('Match deleted from Firestore:', matchId);

      // Re-render the matches list using the centralized function
      await window.loadMatches();

      // Show success message
      showSuccessMessage('Match deleted successfully!');
    } catch (error) {
      console.error('Match deletion error:', error);
      if (matchCard) {
        hideLoadingSpinner(matchCard.id || 'match-card');
      }

      // Show specific error messages based on the error type
      let errorMessage = 'Unable to delete match. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = "You don't have permission to delete this match.";
      } else if (error.code === 'not-found') {
        errorMessage = 'Match not found. It may have already been deleted.';
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  // Edit match
  window.editMatch = async function (matchId) {
    const currentUserId = sessionStorage.getItem('currentUserId');
    if (!currentUserId) {
      alert('Error: You must be logged in to edit matches.');
      return;
    }

    try {
      // Fetch the match from Firestore to get the latest data
      const matchDoc = await getDoc(doc(db, 'matches', matchId));

      if (!matchDoc.exists()) {
        console.error('Match not found for editing:', matchId);
        alert('Error: Match not found.');
        return;
      }

      const match = { id: matchDoc.id, ...matchDoc.data() };

      console.log('Opening edit modal for match:', match);

      // Check if modal function exists (from modals.js)
      if (window.openRecordMatchModal) {
        // Set flag to indicate edit mode
        window.editingMatchId = matchId;

        // Open the modal
        window.openRecordMatchModal();

        // Pre-populate the form with existing data
        setTimeout(() => {
          populateEditForm(match);
        }, 100); // Small delay to ensure modal is open
      } else {
        console.warn('Match modal function not available');
        alert('Match modal will be available when modals.js is loaded');
      }
    } catch (error) {
      console.error('Error fetching match for edit:', error);
      alert('Error: Unable to load match data for editing.');
    }
  };

  // Populate edit form with match data
  function populateEditForm(match) {
    const form = document.getElementById('recordMatchForm');
    if (!form) {
      console.error('Match form not found');
      return;
    }

    // Update modal title
    const modalTitle = document.querySelector('#recordMatchModal .modal-header h3');
    if (modalTitle) {
      modalTitle.textContent = 'Edit Match';
    }

    // Update submit button text
    const submitBtn = form.querySelector('.btn-submit');
    if (submitBtn) {
      submitBtn.textContent = 'Update Match';
    }

    // Populate form fields
    const fields = {
      matchDate: match.date,
      matchOpponent: match.opponent,
      matchType: match.matchType,
      matchResult: match.result,
      yourScore: match.yourScore,
      opponentScore: match.opponentScore,
      yourScore2: match.yourScore2,
      opponentScore2: match.opponentScore2,
      yourScore3: match.yourScore3,
      opponentScore3: match.opponentScore3,
      matchDuration: match.duration,
      matchNotes: match.notes,
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field && value !== undefined) {
        field.value = value;
      }
    });

    console.log('Form populated with match data');
  }

  // Show success message
  function showSuccessMessage(message) {
    // Use the new toast system if available, otherwise fallback to basic implementation
    if (typeof showToast === 'function') {
      showToast(message, 'success');
    } else {
      // Fallback for when toast.js is not loaded
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = message;
      document.body.appendChild(successDiv);
      setTimeout(() => {
        successDiv.remove();
      }, 3000);
    }

    console.log('Success message shown:', message);
  }

  // Hide 'Add New Match' button for coach accounts
  function hideAddButtonForCoach() {
    const addButton = document.getElementById('addMatchBtn');
    if (addButton && window.currentUserData && window.currentUserData.role === 'coach') {
      addButton.classList.add('hidden-for-coach');
      console.log('Add Match button hidden for coach account.');
    } else if (addButton) {
      // Also check sessionStorage as fallback
      const userRole = sessionStorage.getItem('userRole');
      if (userRole === 'coach') {
        addButton.classList.add('hidden-for-coach');
        console.log('Add Match button hidden for coach account (via sessionStorage).');
      }
    }
  }

  // Initialize matches page when DOM is ready
  document.addEventListener('DOMContentLoaded', async function () {
    console.log('Matches page initializing...');

    // Set up event delegation for edit and delete buttons
    setupEventDelegation();

    // Wait for user authentication from sessionStorage
    const currentUserId = sessionStorage.getItem('currentUserId');
    if (!currentUserId) {
      console.log('User not authenticated, redirecting to login.');
      window.location.href = 'login.html';
      return;
    }

    // Check if user is a coach (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('user');

    if (
      userRole === 'coach' ||
      (window.currentUserData && window.currentUserData.role === 'coach')
    ) {
      // Coach mode: Transform page for management view
      isCoachMode = true;
      console.log('Coach mode detected - setting up management interface');

      // Hide 'Add New Match' button for coaches
      hideAddButtonForCoach();

      // Set up coach mode UI
      setupCoachMode();

      // Set up add match button (works in both modes)
      setupAddMatchButton();
    } else {
      // Player mode: Normal functionality
      isCoachMode = false;
      console.log('Player mode - loading normal matches page');

      // Load matches using the centralized function
      await window.loadMatches();

      // Set up add match button
      setupAddMatchButton();
    }

    console.log('Matches page initialized successfully');

    // Initialize header compression for matches page
    try {
      initHeaderCompression();
    } catch (err) {
      console.warn('initHeaderCompression not available on matches page');
    }
  });

  // Export the filtering function for potential external use
  window.filterMatchesData = filterMatchesData;

  // Header compression: toggle .header-compressed on .app-header when scrolling down
  function initHeaderCompression() {
    const header = document.querySelector('.app-header');
    if (!header) return;

    let lastKnownScrollY = window.scrollY || window.pageYOffset;
    let ticking = false;
    const compressThreshold = 60; // px scrolled before compressing

    function onScroll() {
      lastKnownScrollY = window.scrollY || window.pageYOffset;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateHeader(lastKnownScrollY);
          ticking = false;
        });
        ticking = true;
      }
    }

    function updateHeader(scrollY) {
      if (scrollY > compressThreshold) {
        header.classList.add('header-compressed');
      } else {
        header.classList.remove('header-compressed');
      }
    }

    // Attach listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // Run once to set initial state
    updateHeader(window.scrollY || window.pageYOffset);
  }
})();
