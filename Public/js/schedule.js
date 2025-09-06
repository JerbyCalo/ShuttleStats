// ShuttleStats v2 - Schedule Page Logic
console.log("schedule.js loaded");

// Import Firebase functions for Schedule operations
import {
  db,
  auth,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "../config/firebase-config.js";

// Import authentication utilities for better role detection
import { checkAuthenticationState } from "./auth-utils.js";

(function () {
  // Track if we're in coach mode
  let isCoachMode = false;
  let currentFilteredData = [];

  // Current calendar state
  let currentDate = new Date();
  let currentView = "list"; // 'list' or 'calendar'
  let selectedDate = null;

  // Data cleaning function to prevent undefined values
  function cleanScheduleData(data) {
    const cleaned = {};

    // Clean string fields
    ["title", "type", "location", "notes", "time"].forEach((field) => {
      cleaned[field] =
        data[field] && typeof data[field] === "string"
          ? data[field].trim()
          : "";
    });

    // Clean date field
    cleaned.date = data.date || "";

    // Clean userId field (single user ID string)
    cleaned.userId =
      data.userId && typeof data.userId === "string" ? data.userId.trim() : "";

    // Add required IDs if provided
    if (data.createdBy) cleaned.createdBy = data.createdBy;

    return cleaned;
  }

  // Format date to readable string
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  // Format time to readable string
  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Get event type badge class
  function getEventTypeClass(type) {
    switch (type.toLowerCase()) {
      case "training":
        return "event-type-training";
      case "match":
        return "event-type-match";
      case "tournament":
        return "event-type-tournament";
      default:
        return "event-type-training";
    }
  }

  // Get player name by ID (for coach mode) - Using Firestore data
  async function getPlayerName(playerId) {
    try {
      const playerDoc = await getDoc(doc(db, "users", playerId));
      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        return `${playerData.name.first} ${playerData.name.last}`.trim();
      } else {
        return "Unknown Player";
      }
    } catch (error) {
      console.error("Error fetching player name:", error);
      return "Unknown Player";
    }
  }

  // Get participant display text for coach mode (single userId) - Using Firestore data
  async function getParticipantDisplay(userId) {
    if (!userId) {
      return "No participant assigned";
    }

    return await getPlayerName(userId);
  }

  // Filter schedule data by player ID (for coach mode)
  async function filterScheduleData(playerId) {
    // AUTHENTICATION GUARD CLAUSE - Check both sources
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (!window.currentUser && !currentUserId) {
      console.error("No authenticated user found in filterScheduleData");

      if (typeof showToast === "function") {
        showToast("Authentication required to filter schedule data.", "error");
      }

      return [];
    }

    try {
      let scheduleQuery;

      if (window.currentUserData?.role === "coach") {
        if (playerId && playerId !== "") {
          // Coach viewing events for specific player (no more "all" option)
          scheduleQuery = query(
            collection(db, "schedule"),
            where("createdBy", "==", window.currentUser.uid),
            where("userId", "==", playerId),
            orderBy("date", "asc")
          );
        } else {
          // If no specific player is provided, return empty array
          console.log("No player selected, returning empty array");
          return [];
        }
      } else {
        // Player viewing events assigned to them
        scheduleQuery = query(
          collection(db, "schedule"),
          where("userId", "==", window.currentUser.uid),
          orderBy("date", "asc")
        );
      }

      const querySnapshot = await getDocs(scheduleQuery);
      const events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Filtered schedule data: ${events.length} events found`);
      return events;
    } catch (error) {
      console.error("Error filtering schedule data:", error);

      // Show user-friendly error message
      if (typeof showToast === "function") {
        showToast("Error loading schedule data. Please try again.", "error");
      }

      return [];
    }
  }

  // Group events by date for calendar display (works with filtered data in coach mode)
  function groupEventsByDate(eventsData = null) {
    const eventsByDate = {};

    const dataToUse = eventsData || currentFilteredData || [];
    if (!dataToUse) return eventsByDate;

    dataToUse.forEach((event) => {
      const dateKey = event.date;
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    return eventsByDate;
  }

  // Format month/year for display
  function formatMonthYear(date) {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  // Get calendar days for a given month
  function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Get the first day of the week (Sunday = 0)
    const startWeekDay = firstDay.getDay();

    // Go back to start of calendar week
    startDate.setDate(firstDay.getDate() - startWeekDay);

    // Go forward to end of calendar week
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  // Render calendar grid
  function renderCalendar() {
    const calendarGrid = document.getElementById("calendarGrid");
    const currentMonthEl = document.getElementById("currentMonth");

    if (!calendarGrid || !currentMonthEl) return;

    // Update month display
    currentMonthEl.textContent = formatMonthYear(currentDate);

    // Clear existing calendar
    calendarGrid.innerHTML = "";

    // Add day headers
    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayHeaders.forEach((day) => {
      const headerEl = document.createElement("div");
      headerEl.className = "calendar-day-header";
      headerEl.textContent = day;
      calendarGrid.appendChild(headerEl);
    });

    // Get events grouped by date
    const eventsByDate = groupEventsByDate();

    // Get calendar days
    const calendarDays = getCalendarDays(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    const today = new Date();
    const currentMonth = currentDate.getMonth();

    calendarDays.forEach((day) => {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      const isCurrentMonth = day.getMonth() === currentMonth;
      const isToday = day.toDateString() === today.toDateString();
      const dateKey = day.toISOString().split("T")[0];
      const dayEvents = eventsByDate[dateKey] || [];

      if (!isCurrentMonth) {
        dayEl.classList.add("other-month");
      }

      if (isToday) {
        dayEl.classList.add("today");
      }

      if (dayEvents.length > 0) {
        dayEl.classList.add("has-events");
      }

      dayEl.innerHTML = `
        <div class="day-number">${day.getDate()}</div>
        <div class="day-events">
          ${dayEvents
            .slice(0, 2)
            .map(
              (event) => `
            <div class="day-event ${event.type.toLowerCase()}" title="${
                event.title
              }">
              ${event.title}
            </div>
          `
            )
            .join("")}
          ${
            dayEvents.length > 2
              ? `<div class="event-count">+${dayEvents.length - 2}</div>`
              : ""
          }
        </div>
      `;

      // Add click handler to show day events
      dayEl.addEventListener("click", () => showDayEvents(day, dayEvents));

      calendarGrid.appendChild(dayEl);
    });
  }

  // Show events for a specific day
  function showDayEvents(date, events) {
    selectedDate = date;
    const modal = document.getElementById("dayEventsModal");
    const title = document.getElementById("dayEventsTitle");
    const eventsList = document.getElementById("dayEventsList");

    if (!modal || !title || !eventsList) return;

    // Format date for title
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    title.textContent = `Events for ${dateStr}`;

    // Clear and populate events list
    eventsList.innerHTML = "";

    if (events.length === 0) {
      eventsList.innerHTML = `
        <div class="no-data" style="padding: 24px;">
          <div class="no-data-icon">📅</div>
          <h3>No Events Scheduled</h3>
          <p>Click "Add Event for This Day" to create a new event.</p>
        </div>
      `;
    } else {
      events.forEach((event) => {
        const eventEl = document.createElement("div");
        eventEl.className = "day-event-item";
        eventEl.innerHTML = `
          <div class="day-event-header">
            <div>
              <div class="day-event-title">${event.title}</div>
              <div class="day-event-time">${formatTime(event.time)} • ${
          event.location
        }</div>
            </div>
            <div class="day-event-type ${getEventTypeClass(event.type)}">${
          event.type
        }</div>
          </div>
          <div class="day-event-actions">
            <button class="day-event-btn day-event-edit edit-event-btn" data-event-id="${
              event.id
            }">
              ✏️ Edit
            </button>
            <button class="day-event-btn day-event-delete delete-event-btn" data-event-id="${
              event.id
            }">
              🗑️ Delete
            </button>
          </div>
        `;
        eventsList.appendChild(eventEl);
      });
    }

    // Show modal
    openDayEventsModal();
  }

  // Open day events modal
  function openDayEventsModal() {
    const modal = document.getElementById("dayEventsModal");
    const backdrop = document.getElementById("modal-backdrop");

    if (modal && backdrop) {
      modal.style.display = "block";
      backdrop.style.display = "block";

      setTimeout(() => {
        backdrop.classList.add("active");
        modal.classList.add("active");
      }, 10);

      document.body.style.overflow = "hidden";
    }
  }

  // Close day events modal
  function closeDayEventsModal() {
    const modal = document.getElementById("dayEventsModal");
    const backdrop = document.getElementById("modal-backdrop");

    if (modal && backdrop) {
      backdrop.classList.remove("active");
      modal.classList.remove("active");

      setTimeout(() => {
        modal.style.display = "none";
        backdrop.style.display = "none";
        document.body.style.overflow = "";
      }, 300);
    }
  }

  // Switch between views
  function switchView(view) {
    currentView = view;

    const listView = document.getElementById("listView");
    const calendarView = document.getElementById("calendarView");
    const listBtn = document.getElementById("listViewBtn");
    const calendarBtn = document.getElementById("calendarViewBtn");

    if (view === "list") {
      // Show list view, hide calendar view
      listView.classList.add("active");
      calendarView.classList.remove("active");
      listBtn.classList.add("active");
      calendarBtn.classList.remove("active");
    } else {
      // Show calendar view, hide list view
      listView.classList.remove("active");
      calendarView.classList.add("active");
      listBtn.classList.remove("active");
      calendarBtn.classList.add("active");
      renderCalendar();
    }

    console.log(`Switched to ${view} view`);
  }

  // Initialize view state
  function initializeViewState() {
    const listView = document.getElementById("listView");
    const calendarView = document.getElementById("calendarView");
    const listBtn = document.getElementById("listViewBtn");
    const calendarBtn = document.getElementById("calendarViewBtn");

    // Ensure list view is active by default and calendar view is hidden
    if (listView) listView.classList.add("active");
    if (calendarView) calendarView.classList.remove("active");
    if (listBtn) listBtn.classList.add("active");
    if (calendarBtn) calendarBtn.classList.remove("active");

    console.log("Initial view state set to list view");
  }

  // Navigate calendar months
  function navigateMonth(direction) {
    if (direction === "prev") {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    renderCalendar();
  }

  // Create schedule event card
  function createEventCard(event) {
    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.eventId = event.id;

    // For coach mode, add participant info to the header
    const participantInfo =
      isCoachMode && event.userId
        ? `<div class="participant-info" style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;">
        � ${getParticipantDisplay(event.userId)}
       </div>`
        : "";

    card.innerHTML = `
      ${participantInfo}
      <div class="event-card-header">
        <div class="event-date">
          <div class="date-main">${formatDate(event.date)}</div>
          <div class="date-sub">${formatTime(event.time)}</div>
        </div>
        <div class="event-type">
          <span class="type-badge ${getEventTypeClass(event.type)}">${
      event.type
    }</span>
        </div>
      </div>
      
      <div class="event-card-content">
        <div class="event-title">
          <h4>${event.title}</h4>
        </div>
        
        <div class="event-location">
          <span class="location-icon">📍</span>
          <span>${event.location}</span>
        </div>
        
        <div class="event-notes">
          <strong>Notes:</strong>
          <p class="notes-text">${event.notes}</p>
        </div>
      </div>
      
      <div class="event-card-actions">
        <button class="action-btn edit-btn edit-event-btn" data-event-id="${
          event.id
        }" title="Edit Event">
          <span class="btn-icon">✏️</span>
          <span class="btn-text">Edit</span>
        </button>
        <button class="action-btn delete-btn delete-event-btn" data-event-id="${
          event.id
        }" title="Delete Event">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Delete</span>
        </button>
      </div>
    `;

    return card;
  }

  // Update schedule statistics (works with filtered data in coach mode)
  function updateScheduleStats() {
    const totalEventsEl = document.getElementById("totalEvents");
    const upcomingEventsEl = document.getElementById("upcomingEvents");

    const dataToUse = isCoachMode
      ? currentFilteredData
      : window.mockScheduleData;

    if (!dataToUse || dataToUse.length === 0) {
      if (totalEventsEl) totalEventsEl.textContent = "0";
      if (upcomingEventsEl) upcomingEventsEl.textContent = "0";
      return;
    }

    const totalEvents = dataToUse.length;

    // Count upcoming events (events with date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = dataToUse.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }).length;

    if (totalEventsEl) totalEventsEl.textContent = totalEvents;
    if (upcomingEventsEl) upcomingEventsEl.textContent = upcomingEvents;

    console.log(
      `Stats updated: ${totalEvents} total events, ${upcomingEvents} upcoming`
    );
  }

  // Render all schedule events (works with filtered data in coach mode)
  // Render all schedule events (works with filtered data in coach mode)
  async function renderScheduleEvents(eventsData = null) {
    // DEBUGGING: Log the entire authentication process
    console.log("=== RENDER SCHEDULE EVENTS DEBUG START ===");
    console.log(
      "renderScheduleEvents function called at:",
      new Date().toISOString()
    );
    console.log(
      "Called with eventsData parameter:",
      eventsData !== null ? "provided" : "null"
    );

    // Check sessionStorage state
    const currentUserId = sessionStorage.getItem("currentUserId");
    console.log("CurrentUserId from sessionStorage:", currentUserId);

    // Check window authentication state
    console.log("window.currentUser:", window.currentUser);
    console.log("window.currentUserData:", window.currentUserData);

    // Log the full sessionStorage contents
    console.log("Full sessionStorage dump:");
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      console.log(`  ${key}: ${sessionStorage.getItem(key)}`);
    }

    // Check if DOM is ready
    console.log("Document readyState:", document.readyState);

    // Log call stack information
    console.log("Function called from:", new Error().stack);

    // AUTHENTICATION GUARD CLAUSE - Check authentication before doing anything
    if (!currentUserId) {
      console.error("=== AUTHENTICATION FAILURE ===");
      console.error("No authenticated user found in renderScheduleEvents.");
      console.error(
        "This suggests the function was called before authentication setup completed."
      );
      console.error(
        "Check the call stack above to see which function triggered this call."
      );
      console.log("=== RENDER SCHEDULE EVENTS DEBUG END (FAILED) ===");

      const container = document.getElementById("scheduleEventsContainer");
      if (container) {
        showEmptyState("scheduleEventsContainer", {
          icon: "🔒",
          title: "Authentication Required",
          message: "Please log in to view the schedule.",
          actionText: "Go to Login",
          onAction: () => {
            window.location.href = "index.html";
          },
        });
      }

      // Show toast message as well
      if (typeof showToast === "function") {
        showToast("Please log in to view the schedule.", "error");
      }

      return; // Stop execution if no user is found
    }

    console.log("=== AUTHENTICATION SUCCESS ===");
    console.log("Proceeding with renderScheduleEvents...");

    // DATA VALIDATION GUARD CLAUSE - Handle null or invalid data
    console.log("=== DATA VALIDATION CHECK ===");
    console.log("eventsData type:", typeof eventsData);
    console.log("eventsData value:", eventsData);
    console.log("Is eventsData an array?", Array.isArray(eventsData));

    // If eventsData is explicitly null, we'll handle it in the data fetching logic below
    // But if it's provided and not an array, that's an error
    if (eventsData !== null && !Array.isArray(eventsData)) {
      console.error("=== DATA VALIDATION FAILURE ===");
      console.error(
        "Invalid events data provided (not null and not array):",
        eventsData
      );
      console.log("=== RENDER SCHEDULE EVENTS DEBUG END (DATA INVALID) ===");

      const container = document.getElementById("scheduleEventsContainer");
      if (container) {
        showEmptyState("scheduleEventsContainer", {
          icon: "⚠️",
          title: "Data Error",
          message: "Invalid schedule data format. Please refresh the page.",
          actionText: "Refresh Page",
          onAction: () => {
            window.location.reload();
          },
        });
      }

      return; // Stop execution if data format is invalid
    }

    console.log("=== DATA VALIDATION SUCCESS ===");
    console.log("Data format is valid, proceeding...");

    const container = document.getElementById("scheduleEventsContainer");

    if (!container) {
      console.error("Schedule events container not found");
      return;
    }

    // Show loading spinner
    showLocalLoader("scheduleEventsContainer", {
      text: "Loading schedule events...",
      size: "normal",
    });

    try {
      let dataToRender;

      // If specific data is provided, use it
      if (eventsData !== null) {
        console.log("=== USING PROVIDED EVENTS DATA ===");
        dataToRender = eventsData;
      } else {
        console.log("=== FETCHING DATA FROM FIRESTORE ===");

        // Get comprehensive auth state
        const authState = await checkAuthenticationState();
        if (!authState.authenticated) {
          console.error("No authenticated user found");
          showEmptyState("scheduleContainer", {
            icon: "🔒",
            title: "Authentication Required",
            message: "Please log in to view your schedule.",
            actionText: "Go to Login",
            onAction: () => {
              window.location.href = "login.html";
            },
          });
          return;
        }

        const currentUserId = authState.user.uid;
        const userRole = authState.userData?.role || "player";

        console.log("Using user ID:", currentUserId);
        console.log("User role:", userRole);

        if (isCoachMode) {
          // Coach mode: Use current filtered data or fetch all created by coach
          console.log(
            "Coach mode: using filtered data or fetching coach events"
          );
          if (currentFilteredData.length > 0) {
            dataToRender = currentFilteredData;
          } else {
            // Fetch all events created by this coach
            const coachQuery = query(
              collection(db, "schedule"),
              where("createdBy", "==", currentUserId),
              orderBy("date", "asc")
            );
            const coachSnapshot = await getDocs(coachQuery);
            dataToRender = coachSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
        } else {
          console.log("Player mode: fetching events assigned to player");
          // Player mode: Fetch events where userId matches current user
          const scheduleQuery = query(
            collection(db, "schedule"),
            where("userId", "==", currentUserId),
            orderBy("date", "asc")
          );

          const querySnapshot = await getDocs(scheduleQuery);
          dataToRender = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          console.log(`Fetched ${dataToRender.length} events from Firestore`);
        }
      }

      // Clear existing content after loading
      container.innerHTML = "";

      // Hide loading spinner
      hideLoadingSpinner("scheduleEventsContainer");

      // Check if we have schedule data
      console.log("=== CHECKING DATA TO RENDER ===");
      console.log("dataToRender:", dataToRender);
      console.log(
        "dataToRender length:",
        dataToRender ? dataToRender.length : "N/A"
      );

      if (!dataToRender || dataToRender.length === 0) {
        console.log("=== NO DATA TO RENDER - SHOWING EMPTY STATE ===");
        const emptyMessage = isCoachMode ? "" : "";

        showEmptyState("scheduleEventsContainer", {
          icon: "📅",
          title: "No Events Scheduled",
          message: emptyMessage,
        });

        updateScheduleStats(dataToRender);
        console.log("=== RENDER SCHEDULE EVENTS DEBUG END (NO DATA) ===");
        return;
      }

      // Sort events by date (newest first)
      const sortedEvents = [...dataToRender].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      // Create and append event cards (handle async for coach mode)
      for (const event of sortedEvents) {
        const card = await createEventCard(event);
        container.appendChild(card);
      }

      // Update statistics
      updateScheduleStats(sortedEvents);

      console.log(`Rendered ${sortedEvents.length} schedule events`);
      console.log("=== RENDER SCHEDULE EVENTS DEBUG END (SUCCESS) ===");
    } catch (error) {
      console.error("Error rendering schedule events:", error);
      hideLoadingSpinner("scheduleEventsContainer");

      // Show user-friendly error message
      let errorMessage =
        "Unable to load schedule events. Please try refreshing the page.";
      if (error.message.includes("requires an index")) {
        errorMessage =
          "Database indexes are being created. Please try again in a few minutes.";
      }

      showEmptyState("scheduleEventsContainer", {
        icon: "⚠️",
        title: "Error Loading Events",
        message: errorMessage,
        retry: () => renderScheduleEvents(eventsData),
      });

      if (typeof showToast === "function") {
        showToast(
          "Error loading schedule events. Please check your connection.",
          "error"
        );
      }
    }
  }

  // Update schedule statistics (works with filtered data in coach mode)
  function updateScheduleStats(eventsData = null) {
    const totalEventsEl = document.getElementById("totalEvents");
    const upcomingEventsEl = document.getElementById("upcomingEvents");

    const dataToUse = eventsData || currentFilteredData || [];

    if (!dataToUse || dataToUse.length === 0) {
      if (totalEventsEl) totalEventsEl.textContent = "0";
      if (upcomingEventsEl) upcomingEventsEl.textContent = "0";
      return;
    }

    const totalEvents = dataToUse.length;

    // Count upcoming events (events with date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = dataToUse.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }).length;

    if (totalEventsEl) totalEventsEl.textContent = totalEvents;
    if (upcomingEventsEl) upcomingEventsEl.textContent = upcomingEvents;

    console.log(
      `Stats updated: ${totalEvents} total events, ${upcomingEvents} upcoming`
    );
  }

  // Create and inject player filter dropdown (coach mode only) - Using Firestore data
  async function createPlayerFilterDropdown() {
    if (!isCoachMode) {
      return;
    }

    // Check authentication first
    const currentUserId = sessionStorage.getItem("currentUserId");
    if (!currentUserId) {
      console.warn("No authenticated user for player filter dropdown");
      return;
    }

    try {
      // Fetch coach's players from Firestore
      const relationshipsQuery = query(
        collection(db, "coach_players"),
        where("coachId", "==", currentUserId),
        where("status", "==", "accepted")
      );

      const relationshipsSnapshot = await getDocs(relationshipsQuery);

      if (relationshipsSnapshot.empty) {
        console.log("No players found for coach, skipping filter dropdown");
        return;
      }

      // Fetch player details
      const playersData = [];
      for (const relationshipDoc of relationshipsSnapshot.docs) {
        const relationship = relationshipDoc.data();

        try {
          const playerDoc = await getDoc(
            doc(db, "users", relationship.playerId)
          );
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            playersData.push({
              id: playerDoc.id,
              name: `${playerData.name.first} ${playerData.name.last}`.trim(),
            });
          }
        } catch (error) {
          console.error("Error fetching player for dropdown:", error);
        }
      }

      if (playersData.length === 0) {
        console.log("No valid players found for filter dropdown");
        return;
      }

      // Create dropdown container
      const filterContainer = document.createElement("div");
      filterContainer.style.cssText = `
        margin: 20px 0;
        padding: 20px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;

      // Create label
      const label = document.createElement("label");
      label.htmlFor = "playerFilterDropdown";
      label.textContent = "Filter by Player:";
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--text);
        font-size: 1rem;
      `;

      // Create dropdown
      const dropdown = document.createElement("select");
      dropdown.id = "playerFilterDropdown";
      dropdown.className = "form-control";
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
      dropdown.innerHTML = "";

      // Add player options (sorted by name) - NO "All Players" option
      playersData.sort((a, b) => a.name.localeCompare(b.name));
      playersData.forEach((player) => {
        const option = document.createElement("option");
        option.value = player.id;
        option.textContent = player.name;
        dropdown.appendChild(option);
      });

      // Automatically select the first player and load their data
      if (playersData.length > 0) {
        dropdown.value = playersData[0].id;
        console.log(`Auto-selected first player: ${playersData[0].name}`);
      }

      // Add event listener for filtering
      dropdown.addEventListener("change", async function () {
        const selectedPlayerId = this.value;
        console.log("=== DROPDOWN FILTER CHANGE EVENT ===");
        console.log(`Filtering schedule data for player: ${selectedPlayerId}`);
        console.log(
          "Dropdown change event triggered at:",
          new Date().toISOString()
        );

        // Show loading while filtering
        showLocalLoader("scheduleEventsContainer", {
          text: "Filtering events...",
          size: "small",
        });

        try {
          // Filter the data from Firestore
          console.log("About to call filterScheduleData...");
          currentFilteredData = await filterScheduleData(selectedPlayerId);

          // Re-render both list and calendar views with filtered data
          console.log(
            "About to call renderScheduleEvents from dropdown change..."
          );
          await renderScheduleEvents();
          if (currentView === "calendar") {
            renderCalendar();
          }
        } catch (error) {
          console.error("Error filtering schedule data:", error);
          hideLoadingSpinner("scheduleEventsContainer");

          if (typeof showToast === "function") {
            showToast("Error filtering events. Please try again.", "error");
          }
        }
      });

      // Assemble the filter container
      filterContainer.appendChild(label);
      filterContainer.appendChild(dropdown);

      // Find the action bar and insert the filter before it
      const actionBar = document.querySelector(".action-bar");
      if (actionBar && actionBar.parentNode) {
        actionBar.parentNode.insertBefore(filterContainer, actionBar);
      }

      // Trigger initial change event to load first player's data
      setTimeout(() => {
        console.log("=== TRIGGERING INITIAL DROPDOWN CHANGE EVENT ===");
        console.log(
          "Auto-triggering dropdown change at:",
          new Date().toISOString()
        );
        console.log("Current authentication state before auto-trigger:");
        console.log(
          "  sessionStorage currentUserId:",
          sessionStorage.getItem("currentUserId")
        );
        console.log("  window.currentUser:", window.currentUser);
        dropdown.dispatchEvent(new Event("change"));
      }, 100);

      console.log(
        "Player filter dropdown created and initialized with real data"
      );
    } catch (error) {
      console.error("Error creating player filter dropdown:", error);
    }
  }

  // Set up coach mode UI transformations
  function setupCoachMode() {
    console.log("Setting up coach mode UI...");

    // Update page title
    const pageTitle = document.querySelector(".page-title h1");
    if (pageTitle) {
      pageTitle.textContent = "My Schedule";
    }

    // Update subheading
    const subheading = document.querySelector(".page-title .subheading");
    if (subheading) {
      subheading.textContent = "Manage your coaching schedule and events";
    }

    // DO NOT create player filter dropdown for schedule - coach manages their own events
    // createPlayerFilterDropdown(); // REMOVED

    console.log("Coach mode UI setup complete (no player filter for schedule)");
  }

  // Set up "Add New Event" button
  function setupAddEventButton() {
    const addButton = document.getElementById("addEventBtn");

    if (addButton) {
      addButton.addEventListener("click", function () {
        console.log("Opening event modal");

        // Clear any selected date when adding from main button
        selectedDate = null;

        // Check if modal function exists (from modals.js)
        if (window.openAddEventModal) {
          window.openAddEventModal();
        } else {
          console.warn("Event modal function not available");
          alert("Event modal will be available when modals.js is loaded");
        }
      });

      console.log("Add event button set up");
    } else {
      console.warn("Add event button not found");
    }
  }

  // Set up view toggle buttons
  function setupViewToggle() {
    const listViewBtn = document.getElementById("listViewBtn");
    const calendarViewBtn = document.getElementById("calendarViewBtn");

    if (listViewBtn) {
      listViewBtn.addEventListener("click", () => switchView("list"));
    }

    if (calendarViewBtn) {
      calendarViewBtn.addEventListener("click", () => switchView("calendar"));
    }
  }

  // Set up calendar navigation
  function setupCalendarNavigation() {
    const prevBtn = document.getElementById("prevMonthBtn");
    const nextBtn = document.getElementById("nextMonthBtn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => navigateMonth("prev"));
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => navigateMonth("next"));
    }
  }

  // Set up day events modal
  function setupDayEventsModal() {
    const addEventForDayBtn = document.getElementById("addEventForDay");

    if (addEventForDayBtn) {
      addEventForDayBtn.addEventListener("click", () => {
        closeDayEventsModal();

        // Pre-fill date if a day is selected
        if (selectedDate && window.openAddEventModal) {
          window.openAddEventModal();

          // Pre-fill the date field after modal opens
          setTimeout(() => {
            const dateField = document.getElementById("eventDate");
            if (dateField && selectedDate) {
              dateField.value = selectedDate.toISOString().split("T")[0];
            }
          }, 100);
        }
      });
    }

    // Set up modal close handlers for day events modal
    const dayEventsModal = document.getElementById("dayEventsModal");
    if (dayEventsModal) {
      const closeButtons = dayEventsModal.querySelectorAll(".modal-close");
      closeButtons.forEach((btn) => {
        btn.addEventListener("click", closeDayEventsModal);
      });
    }
  }

  // Delete event function
  async function deleteEvent(eventId) {
    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    // Find the event card and show loading state
    const eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
    if (eventCard) {
      showLocalLoader(eventCard.id || "event-card", {
        text: "Deleting event...",
        size: "small",
      });
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "schedule", eventId));

      console.log("Event deleted:", eventId);

      // Re-render both views
      if (isCoachMode) {
        // In coach mode, re-apply the current filter
        const dropdown = document.getElementById("playerFilterDropdown");
        if (dropdown) {
          currentFilteredData = await filterScheduleData(dropdown.value);
        }
      }
      await renderScheduleEvents();
      if (currentView === "calendar") {
        renderCalendar();
      }

      // Close day events modal if open
      closeDayEventsModal();

      // Show success message
      showSuccessMessage("Event deleted successfully!");
    } catch (error) {
      console.error("Event deletion error:", error);
      if (eventCard) {
        hideLoadingSpinner(eventCard.id || "event-card");
      }

      let errorMessage = "Unable to delete event. Please try again.";
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to delete this event.";
      } else if (error.code === "not-found") {
        errorMessage = "Event not found. It may have already been deleted.";
      }

      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  }

  // Edit event function
  async function editEvent(eventId) {
    try {
      // Find the event to edit in Firestore
      const eventDoc = await getDoc(doc(db, "schedule", eventId));

      if (!eventDoc.exists()) {
        console.error("Event not found for editing:", eventId);
        if (typeof showToast === "function") {
          showToast("Event not found. It may have been deleted.", "error");
        } else {
          alert("Error: Event not found.");
        }
        return;
      }

      const event = { id: eventDoc.id, ...eventDoc.data() };
      console.log("Opening edit modal for event:", event);

      // Close day events modal if open
      closeDayEventsModal();

      // Check if modal function exists (from modals.js)
      if (window.openAddEventModal) {
        // Set flag to indicate edit mode
        window.editingEventId = eventId;

        // Open the modal
        window.openAddEventModal();

        // Pre-populate the form with existing data
        setTimeout(() => {
          populateEditForm(event);
        }, 100); // Small delay to ensure modal is open
      } else {
        console.warn("Event modal function not available");
        alert("Event modal will be available when modals.js is loaded");
      }
    } catch (error) {
      console.error("Error fetching event for editing:", error);

      let errorMessage = "Unable to load event for editing. Please try again.";
      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to edit this event.";
      }

      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  }

  // Populate edit form with event data
  function populateEditForm(event) {
    const form = document.getElementById("addEventForm");
    if (!form) {
      console.error("Event form not found");
      return;
    }

    // Update modal title
    const modalTitle = document.querySelector(
      "#addEventModal .modal-header h3"
    );
    if (modalTitle) {
      modalTitle.textContent = "Edit Event";
    }

    // Update submit button text
    const submitBtn = form.querySelector(".btn-submit");
    if (submitBtn) {
      submitBtn.textContent = "Update Event";
    }

    // Populate form fields
    const fields = {
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventType: event.type,
      eventLocation: event.location,
      eventNotes: event.notes,
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.value = value || "";
      }
    });

    console.log("Form populated with event data");
  }

  // Show success message
  function showSuccessMessage(message) {
    // Use the new toast system if available, otherwise fallback to basic implementation
    if (typeof showToast === "function") {
      showToast(message, "success");
    } else {
      // Fallback for when toast.js is not loaded
      const successDiv = document.createElement("div");
      successDiv.className = "success-message";
      successDiv.textContent = message;
      document.body.appendChild(successDiv);
      setTimeout(() => {
        successDiv.remove();
      }, 3000);
    }

    console.log("Success message shown:", message);
  }

  // Set up event delegation for schedule action buttons
  function setupScheduleEventDelegation() {
    console.log("Setting up schedule event delegation...");

    // Single event listener for all event action buttons
    document.addEventListener("click", async function (event) {
      const target = event.target;

      // Handle delete event buttons
      if (
        target.matches(".delete-event-btn") ||
        target.closest(".delete-event-btn")
      ) {
        event.preventDefault();
        const button = target.matches(".delete-event-btn")
          ? target
          : target.closest(".delete-event-btn");
        const eventId = button.getAttribute("data-event-id");

        if (eventId) {
          console.log("Delete event clicked:", eventId);
          await deleteEvent(eventId);
        } else {
          console.error("No event ID found for delete button");
        }
      }

      // Handle edit event buttons
      if (
        target.matches(".edit-event-btn") ||
        target.closest(".edit-event-btn")
      ) {
        event.preventDefault();
        const button = target.matches(".edit-event-btn")
          ? target
          : target.closest(".edit-event-btn");
        const eventId = button.getAttribute("data-event-id");

        if (eventId) {
          console.log("Edit event clicked:", eventId);
          await editEvent(eventId);
        } else {
          console.error("No event ID found for edit button");
        }
      }
    });

    console.log("Schedule event delegation setup complete");
  }

  // Initialize schedule page when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("=== SCHEDULE PAGE INITIALIZATION DEBUG ===");
    console.log("DOMContentLoaded fired at:", new Date().toISOString());
    console.log("Schedule page initializing...");

    // Debug authentication state at initialization
    const currentUserId = sessionStorage.getItem("currentUserId");
    console.log("Authentication state during initialization:");
    console.log("  currentUserId from sessionStorage:", currentUserId);
    console.log("  window.currentUser:", window.currentUser);
    console.log("  window.currentUserData:", window.currentUserData);

    // Authentication guard - check if user is logged in
    if (!currentUserId) {
      console.error("=== INITIALIZATION AUTHENTICATION FAILURE ===");
      console.error("No authenticated user found during DOMContentLoaded.");
      console.error("This suggests role-manager.js hasn't run yet or failed.");

      if (typeof showToast === "function") {
        showToast("Please log in to view the schedule.", "error");
      } else {
        alert("Please log in to view the schedule.");
      }
      // Redirect to login page
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
      return; // Stop execution
    }

    console.log("=== INITIALIZATION AUTHENTICATION SUCCESS ===");
    console.log("Proceeding with schedule page setup...");

    // Check if user is a coach (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get("user");

    if (userRole === "coach") {
      // Coach mode: Transform page for management view
      isCoachMode = true;
      console.log("Coach mode detected - setting up management interface");

      // Set up coach mode UI
      setupCoachMode();

      // Initialize view state (ensure list view is shown by default)
      initializeViewState();

      // Set up all UI interactions
      setupAddEventButton();
      setupViewToggle();
      setupCalendarNavigation();
      setupDayEventsModal();

      // Set up global click handler for backdrop
      const backdrop = document.getElementById("modal-backdrop");
      if (backdrop) {
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop) {
            closeDayEventsModal();
          }
        });
      }

      // Set up escape key handler
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeDayEventsModal();
        }
      });

      // Load coach's own events
      console.log("Loading coach's own schedule events...");
      renderScheduleEvents();

      // Set up event delegation for schedule actions
      setupScheduleEventDelegation();
    } else {
      // Player mode: Normal functionality
      isCoachMode = false;
      console.log("Player mode - loading normal schedule page");

      // Initialize view state (ensure list view is shown by default)
      initializeViewState();

      // Render schedule events (list view)
      console.log(
        "=== CALLING renderScheduleEvents FROM PLAYER MODE INITIALIZATION ==="
      );
      console.log(
        "About to call renderScheduleEvents at:",
        new Date().toISOString()
      );
      renderScheduleEvents();

      // Set up all UI interactions
      setupAddEventButton();
      setupViewToggle();
      setupCalendarNavigation();
      setupDayEventsModal();

      // Set up global click handler for backdrop
      const backdrop = document.getElementById("modal-backdrop");
      if (backdrop) {
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop) {
            closeDayEventsModal();
          }
        });
      }

      // Set up escape key handler
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeDayEventsModal();
        }
      });

      // Set up event delegation for schedule actions
      setupScheduleEventDelegation();
    }

    console.log("Schedule page initialized successfully");
  });

  // Export functions for external use
  window.renderScheduleEvents = renderScheduleEvents;
  window.renderCalendar = renderCalendar;
  window.filterScheduleData = filterScheduleData;
})();
