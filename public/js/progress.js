// ShuttleStats v2 - Progress Page Logic with Chart.js Analytics
console.log('progress.js loaded');

// Import Firebase functions
import {
  db,
  auth,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from '../config/firebase-config.js';

(function () {
  // Chart instances storage
  let charts = {};

  // Color palette from project theme
  const colors = {
    primary: '#1211ca',
    secondary: '#f9b314',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    muted: '#666',
    border: '#e1e5e9',
    bg: '#f8f9fb',
  };

  // Gradient helper
  function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  }

  // ============================================
  // DATA FETCHING FUNCTIONS
  // ============================================

  // Fetch training sessions from Firestore
  async function fetchTrainingSessions(userId) {
    try {
      const q = query(
        collection(db, 'training'),
        where('playerId', '==', userId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Fetched ${sessions.length} training sessions`);
      return sessions;
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      return [];
    }
  }

  // Fetch matches from Firestore
  async function fetchMatches(userId) {
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

      console.log(`Fetched ${matches.length} matches`);
      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  }

  // Fetch goals from Firestore
  async function fetchGoals(userId) {
    try {
      const q = query(
        collection(db, 'goals'),
        where('playerId', '==', userId),
        where('status', '!=', 'completed'),
        orderBy('status'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const goals = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Fetched ${goals.length} active goals`);
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  // ============================================
  // DATA PROCESSING FUNCTIONS
  // ============================================

  // Get month name from date
  function getMonthName(date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const d = new Date(date);
    return months[d.getMonth()];
  }

  // Get last N months of data
  function getLastNMonths(n = 6) {
    const months = [];
    const now = new Date();

    for (let i = n - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: getMonthName(date),
        year: date.getFullYear(),
        month: date.getMonth(),
      });
    }

    return months;
  }

  // Process performance data by month
  function processPerformanceData(trainingSessions, matches) {
    const months = getLastNMonths(6);
    const trainingByMonth = new Array(6).fill(0);
    const matchesByMonth = new Array(6).fill(0);

    // Count training sessions by month
    trainingSessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      const monthIndex = months.findIndex(
        (m) => m.month === sessionDate.getMonth() && m.year === sessionDate.getFullYear()
      );
      if (monthIndex !== -1) {
        trainingByMonth[monthIndex]++;
      }
    });

    // Count matches by month
    matches.forEach((match) => {
      const matchDate = new Date(match.date);
      const monthIndex = months.findIndex(
        (m) => m.month === matchDate.getMonth() && m.year === matchDate.getFullYear()
      );
      if (monthIndex !== -1) {
        matchesByMonth[monthIndex]++;
      }
    });

    return {
      labels: months.map((m) => m.label),
      trainingSessions: trainingByMonth,
      matches: matchesByMonth,
    };
  }

  // Process training intensity distribution
  function processIntensityData(trainingSessions) {
    const intensityCounts = {
      low: 0, // 1-3
      medium: 0, // 4-6
      high: 0, // 7-8
      extreme: 0, // 9-10
    };

    trainingSessions.forEach((session) => {
      const intensity = session.intensity;
      const intensityNum = parseInt(intensity);

      if (!isNaN(intensityNum)) {
        // Numeric intensity (1-10)
        if (intensityNum >= 9) {
          intensityCounts.extreme++;
        } else if (intensityNum >= 7) {
          intensityCounts.high++;
        } else if (intensityNum >= 4) {
          intensityCounts.medium++;
        } else {
          intensityCounts.low++;
        }
      } else {
        // Legacy text intensity
        const intensityLower = intensity.toLowerCase();
        if (intensityLower === 'high') {
          intensityCounts.high++;
        } else if (intensityLower === 'medium') {
          intensityCounts.medium++;
        } else if (intensityLower === 'low') {
          intensityCounts.low++;
        }
      }
    });

    return {
      labels: ['Low (1-3)', 'Medium (4-6)', 'High (7-8)', 'Extreme (9-10)'],
      values: [
        intensityCounts.low,
        intensityCounts.medium,
        intensityCounts.high,
        intensityCounts.extreme,
      ],
      colors: [colors.info, colors.secondary, colors.primary, colors.danger],
    };
  }

  // Process match results
  function processMatchResults(matches) {
    const results = {
      wins: 0,
      losses: 0,
      draws: 0,
    };

    matches.forEach((match) => {
      const result = match.result?.toLowerCase();
      if (result === 'win') {
        results.wins++;
      } else if (result === 'loss') {
        results.losses++;
      } else if (result === 'draw') {
        results.draws++;
      }
    });

    return {
      labels: ['Wins', 'Losses', 'Draws'],
      values: [results.wins, results.losses, results.draws],
      colors: [colors.success, colors.danger, colors.muted],
    };
  }

  // Process weekly activity (last 4 weeks)
  function processWeeklyActivity(trainingSessions, matches) {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const trainingByWeek = new Array(4).fill(0);
    const matchesByWeek = new Array(4).fill(0);

    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Count training sessions by week
    trainingSessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= fourWeeksAgo) {
        const daysSince = Math.floor((now - sessionDate) / (24 * 60 * 60 * 1000));
        const weekIndex = Math.floor(daysSince / 7);
        if (weekIndex >= 0 && weekIndex < 4) {
          trainingByWeek[3 - weekIndex]++; // Reverse order (oldest to newest)
        }
      }
    });

    // Count matches by week
    matches.forEach((match) => {
      const matchDate = new Date(match.date);
      if (matchDate >= fourWeeksAgo) {
        const daysSince = Math.floor((now - matchDate) / (24 * 60 * 60 * 1000));
        const weekIndex = Math.floor(daysSince / 7);
        if (weekIndex >= 0 && weekIndex < 4) {
          matchesByWeek[3 - weekIndex]++; // Reverse order (oldest to newest)
        }
      }
    });

    return {
      labels: weeks,
      training: trainingByWeek,
      matches: matchesByWeek,
    };
  }

  // Process goals progress
  function processGoalsProgress(goals) {
    // Limit to top 5 active goals
    const topGoals = goals.slice(0, 5);

    if (topGoals.length === 0) {
      return {
        labels: ['No active goals'],
        progress: [0],
      };
    }

    return {
      labels: topGoals.map((goal) => goal.title || 'Untitled Goal'),
      progress: topGoals.map((goal) => goal.progress || 0),
    };
  }

  // Calculate performance insights
  function calculateInsights(trainingSessions, matches) {
    // Overall growth (compare last 3 months vs previous 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const recentSessions = trainingSessions.filter(
      (s) => new Date(s.date) >= threeMonthsAgo
    ).length;
    const previousSessions = trainingSessions.filter(
      (s) => new Date(s.date) >= sixMonthsAgo && new Date(s.date) < threeMonthsAgo
    ).length;

    const growth =
      previousSessions > 0
        ? Math.round(((recentSessions - previousSessions) / previousSessions) * 100)
        : 0;

    // Peak sessions (max in any month)
    const performanceData = processPerformanceData(trainingSessions, matches);
    const peakSessions = Math.max(...performanceData.trainingSessions);

    // Consistency (percentage of weeks with at least 1 session in last 3 months)
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    const weeksWithActivity = new Set();

    trainingSessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= twelveWeeksAgo) {
        const weekNumber = Math.floor((now - sessionDate) / (7 * 24 * 60 * 60 * 1000));
        weeksWithActivity.add(weekNumber);
      }
    });

    const consistency = Math.round((weeksWithActivity.size / 12) * 100);

    return {
      growth: growth >= 0 ? `+${growth}%` : `${growth}%`,
      peakSessions,
      consistency: `${consistency}%`,
    };
  }

  // Update statistics cards
  function updateStatsCards(trainingSessions, matches) {
    // Total sessions
    const totalSessionsEl = document.getElementById('totalSessions');
    if (totalSessionsEl) {
      totalSessionsEl.textContent = trainingSessions.length;
    }

    // Total matches
    const totalMatchesEl = document.getElementById('totalMatches');
    if (totalMatchesEl) {
      totalMatchesEl.textContent = matches.length;
    }

    // Win rate
    const winRateEl = document.getElementById('winRate');
    if (winRateEl) {
      const wins = matches.filter((m) => m.result?.toLowerCase() === 'win').length;
      const totalMatches = matches.length;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      winRateEl.textContent = `${winRate}%`;
    }

    // Average intensity
    const avgIntensityEl = document.getElementById('avgIntensity');
    if (avgIntensityEl && trainingSessions.length > 0) {
      let totalIntensity = 0;
      let validCount = 0;

      trainingSessions.forEach((session) => {
        const intensityNum = parseInt(session.intensity);
        if (!isNaN(intensityNum)) {
          totalIntensity += intensityNum;
          validCount++;
        } else {
          // Convert legacy text to numeric
          const intensityLower = session.intensity?.toLowerCase();
          if (intensityLower === 'high') {
            totalIntensity += 8;
            validCount++;
          } else if (intensityLower === 'medium') {
            totalIntensity += 5;
            validCount++;
          } else if (intensityLower === 'low') {
            totalIntensity += 2;
            validCount++;
          }
        }
      });

      const avgIntensity = validCount > 0 ? (totalIntensity / validCount).toFixed(1) : 0;
      avgIntensityEl.textContent = avgIntensity;
    }
  }

  // ============================================
  // CHART INITIALIZATION FUNCTIONS
  // ============================================

  // ============================================
  // CHART INITIALIZATION FUNCTIONS
  // ============================================

  // 1. Performance Over Time Chart
  function initPerformanceChart(performanceData, insights) {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    const gradient1 = createGradient(
      ctx.getContext('2d'),
      colors.primary + '80',
      colors.primary + '20'
    );
    const gradient2 = createGradient(
      ctx.getContext('2d'),
      colors.secondary + '80',
      colors.secondary + '20'
    );

    charts.performance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: performanceData.labels,
        datasets: [
          {
            label: 'Training Sessions',
            data: performanceData.trainingSessions,
            borderColor: colors.primary,
            backgroundColor: gradient1,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: 'Matches',
            data: performanceData.matches,
            borderColor: colors.secondary,
            backgroundColor: gradient2,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: colors.secondary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 13,
                weight: '600',
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: '600',
            },
            bodyFont: {
              size: 13,
            },
            cornerRadius: 8,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: colors.border,
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: '500',
              },
              color: colors.muted,
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: '500',
              },
              color: colors.muted,
            },
          },
        },
      },
    });

    // Update insights
    updateInsights(insights);
  }

  // Update performance insights
  function updateInsights(insights) {
    const insightItems = document.querySelectorAll('.insight-item');
    if (insightItems.length >= 3) {
      insightItems[0].querySelector('.insight-value').textContent = insights.growth;
      insightItems[1].querySelector('.insight-value').textContent = insights.peakSessions;
      insightItems[2].querySelector('.insight-value').textContent = insights.consistency;
    }
  }

  // 2. Training Intensity Chart
  function initIntensityChart(intensityData) {
    const ctx = document.getElementById('intensityChart');
    if (!ctx) return;

    charts.intensity = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: intensityData.labels,
        datasets: [
          {
            data: intensityData.values,
            backgroundColor: intensityData.colors,
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12,
                weight: '600',
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} sessions (${percentage}%)`;
              },
            },
          },
        },
        cutout: '65%',
      },
    });
  }

  // 3. Match Results Chart
  function initMatchResultsChart(matchResultsData) {
    const ctx = document.getElementById('matchResultsChart');
    if (!ctx) return;

    charts.matchResults = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: matchResultsData.labels,
        datasets: [
          {
            data: matchResultsData.values,
            backgroundColor: matchResultsData.colors,
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12,
                weight: '600',
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} matches (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  // 4. Weekly Activity Chart
  function initWeeklyActivityChart(weeklyActivityData) {
    const ctx = document.getElementById('weeklyActivityChart');
    if (!ctx) return;

    charts.weeklyActivity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeklyActivityData.labels,
        datasets: [
          {
            label: 'Training Sessions',
            data: weeklyActivityData.training,
            backgroundColor: colors.primary,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Matches',
            data: weeklyActivityData.matches,
            backgroundColor: colors.secondary,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                weight: '600',
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: colors.border,
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: '500',
              },
              color: colors.muted,
              stepSize: 2,
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: '500',
              },
              color: colors.muted,
            },
          },
        },
      },
    });
  }

  // 6. Goals Progress Chart
  function initGoalsProgressChart(goalsProgressData) {
    const ctx = document.getElementById('goalsProgressChart');
    if (!ctx) return;

    // Create gradient for each bar
    const gradientColors = goalsProgressData.progress.map((value) => {
      if (value >= 80) return colors.success;
      if (value >= 60) return colors.primary;
      if (value >= 40) return colors.secondary;
      return colors.warning;
    });

    charts.goalsProgress = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: goalsProgressData.labels,
        datasets: [
          {
            label: 'Progress (%)',
            data: goalsProgressData.progress,
            backgroundColor: gradientColors,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return `Progress: ${context.parsed.x}%`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: colors.border,
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: '500',
              },
              color: colors.muted,
              callback: function (value) {
                return value + '%';
              },
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: '600',
              },
              color: colors.primary,
            },
          },
        },
      },
    });
  }

  // Cleanup function to destroy charts
  function destroyCharts() {
    Object.values(charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    charts = {};
  }

  // Main function to load all data and initialize charts
  async function loadProgressData() {
    try {
      // Show loading state
      if (typeof showGlobalLoader === 'function') {
        showGlobalLoader('Loading progress data...');
      }

      // Get current user ID
      const currentUserId =
        auth.currentUser?.uid || sessionStorage.getItem('currentUserId');
      if (!currentUserId) {
        console.error('No user ID available');
        if (typeof hideLoadingSpinner === 'function') {
          hideLoadingSpinner();
        }
        return;
      }

      console.log('Loading progress data for user:', currentUserId);

      // Fetch all data in parallel
      const [trainingSessions, matches, goals] = await Promise.all([
        fetchTrainingSessions(currentUserId),
        fetchMatches(currentUserId),
        fetchGoals(currentUserId),
      ]);

      console.log('Data fetched:', {
        trainingSessions: trainingSessions.length,
        matches: matches.length,
        goals: goals.length,
      });

      // Process data for charts
      const performanceData = processPerformanceData(trainingSessions, matches);
      const intensityData = processIntensityData(trainingSessions);
      const matchResultsData = processMatchResults(matches);
      const weeklyActivityData = processWeeklyActivity(trainingSessions, matches);
      const goalsProgressData = processGoalsProgress(goals);
      const insights = calculateInsights(trainingSessions, matches);

      // Update stats cards
      updateStatsCards(trainingSessions, matches);

      // Initialize all charts with real data
      initPerformanceChart(performanceData, insights);
      initIntensityChart(intensityData);
      initMatchResultsChart(matchResultsData);
      initWeeklyActivityChart(weeklyActivityData);
      initGoalsProgressChart(goalsProgressData);

      console.log('All charts initialized with real data');

      // Hide loading state
      if (typeof hideLoadingSpinner === 'function') {
        hideLoadingSpinner();
      }
    } catch (error) {
      console.error('Error loading progress data:', error);

      if (typeof hideLoadingSpinner === 'function') {
        hideLoadingSpinner();
      }

      if (typeof showToast === 'function') {
        showToast('Failed to load progress data. Please refresh the page.', 'error');
      }
    }
  }

  // Initialize progress page when DOM is ready
  document.addEventListener('DOMContentLoaded', async function () {
    console.log('Progress page initializing...');

    // Check if user is a coach (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('user');

    if (userRole === 'coach') {
      // Coach view: Update page for management view
      console.log('Coach view detected - switching to management mode');

      // Update page title
      const pageTitle = document.querySelector('h1');
      if (pageTitle) {
        pageTitle.textContent = 'Player Progress Management';
      }

      // Update subheading if it exists
      const subheading = document.querySelector('.subheading');
      if (subheading) {
        subheading.textContent = 'Track progress for all players';
      }

      // Replace main content with coach placeholder
      const mainContent = document.querySelector('#mainContent .page-content');
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
      // Player view: Load real data and initialize charts
      console.log('Player view - loading analytics dashboard with real data');

      // Wait for Chart.js to be fully loaded
      if (typeof Chart !== 'undefined') {
        // Set default Chart.js options
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = colors.text;

        // Wait for authentication
        const waitForAuth = () => {
          return new Promise((resolve) => {
            if (auth.currentUser || sessionStorage.getItem('currentUserId')) {
              resolve();
            } else {
              const checkAuth = setInterval(() => {
                if (auth.currentUser || sessionStorage.getItem('currentUserId')) {
                  clearInterval(checkAuth);
                  resolve();
                }
              }, 100);

              // Timeout after 5 seconds
              setTimeout(() => {
                clearInterval(checkAuth);
                resolve();
              }, 5000);
            }
          });
        };

        await waitForAuth();

        // Load all data and initialize charts
        await loadProgressData();

        console.log('Analytics dashboard initialized with real data');
      } else {
        console.error('Chart.js library not loaded');
      }
    }

    console.log('Progress page initialized successfully');
  });

  // Initialize header compression after DOM is ready
  try {
    initHeaderCompression();
  } catch (e) {
    // ignore if header not present or other timing issues
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', destroyCharts);

  // Header compression: toggles .header-compressed on .app-header when scrolling
  function initHeaderCompression() {
    const header = document.querySelector('.app-header');
    if (!header) return;

    let ticking = false;
    const compressThreshold = 60;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shouldCompress = window.scrollY > compressThreshold;
          header.classList.toggle('header-compressed', shouldCompress);
          ticking = false;
        });
        ticking = true;
      }
    }

    // Use passive listener for smoother scrolling
    window.addEventListener('scroll', onScroll, { passive: true });
    // Run once to set initial state
    onScroll();
  }
})();
