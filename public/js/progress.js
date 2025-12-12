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

  // Current time period filter (in days, or 'all')
  let currentPeriod = 180;

  // Cached data for filtering
  let cachedData = {
    trainingSessions: [],
    matches: [],
    goals: [],
  };

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

  // Filter data by current time period
  function filterByPeriod(data, period) {
    if (period === 'all') return data;

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  }

  // Get period label for display
  function getPeriodLabel(period) {
    switch (period) {
      case 30:
        return 'Last 30 Days';
      case 90:
        return 'Last 3 Months';
      case 180:
        return 'Last 6 Months';
      case 'all':
        return 'All Time';
      default:
        return 'Last 6 Months';
    }
  }

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
      totalSessionsEl.classList.remove('skeleton');
    }

    // Total matches
    const totalMatchesEl = document.getElementById('totalMatches');
    if (totalMatchesEl) {
      totalMatchesEl.textContent = matches.length;
      totalMatchesEl.classList.remove('skeleton');
    }

    // Win rate
    const winRateEl = document.getElementById('winRate');
    if (winRateEl) {
      const wins = matches.filter((m) => m.result?.toLowerCase() === 'win').length;
      const totalMatches = matches.length;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
      winRateEl.textContent = `${winRate}%`;
      winRateEl.classList.remove('skeleton');
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
      avgIntensityEl.classList.remove('skeleton');
    } else if (avgIntensityEl) {
      avgIntensityEl.textContent = '-';
      avgIntensityEl.classList.remove('skeleton');
    }

    // Update comparison metrics
    updateComparisonMetrics(trainingSessions, matches);
  }

  // Calculate and display comparison metrics (vs previous period)
  function updateComparisonMetrics(trainingSessions, matches) {
    const now = new Date();
    const periodDays = currentPeriod === 'all' ? 180 : currentPeriod;
    const halfPeriod = periodDays / 2;

    const midDate = new Date(now.getTime() - halfPeriod * 24 * 60 * 60 * 1000);
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Sessions comparison
    const recentSessions = trainingSessions.filter(
      (s) => new Date(s.date) >= midDate
    ).length;
    const previousSessions = trainingSessions.filter((s) => {
      const d = new Date(s.date);
      return d >= startDate && d < midDate;
    }).length;

    updateComparisonElement(
      'sessionsComparison',
      recentSessions,
      previousSessions,
      'vs prev period'
    );

    // Matches comparison
    const recentMatches = matches.filter((m) => new Date(m.date) >= midDate).length;
    const previousMatches = matches.filter((m) => {
      const d = new Date(m.date);
      return d >= startDate && d < midDate;
    }).length;

    updateComparisonElement(
      'matchesComparison',
      recentMatches,
      previousMatches,
      'vs prev period'
    );

    // Win rate comparison
    const recentMatchesData = matches.filter((m) => new Date(m.date) >= midDate);
    const previousMatchesData = matches.filter((m) => {
      const d = new Date(m.date);
      return d >= startDate && d < midDate;
    });

    const recentWinRate =
      recentMatchesData.length > 0
        ? Math.round(
            (recentMatchesData.filter((m) => m.result?.toLowerCase() === 'win').length /
              recentMatchesData.length) *
              100
          )
        : 0;
    const previousWinRate =
      previousMatchesData.length > 0
        ? Math.round(
            (previousMatchesData.filter((m) => m.result?.toLowerCase() === 'win').length /
              previousMatchesData.length) *
              100
          )
        : 0;

    updateComparisonElement(
      'winRateComparison',
      recentWinRate,
      previousWinRate,
      'vs prev period',
      true
    );

    // Intensity comparison
    const calcAvgIntensity = (sessions) => {
      let total = 0,
        count = 0;
      sessions.forEach((s) => {
        const val = parseInt(s.intensity);
        if (!isNaN(val)) {
          total += val;
          count++;
        }
      });
      return count > 0 ? total / count : 0;
    };

    const recentIntensity = calcAvgIntensity(
      trainingSessions.filter((s) => new Date(s.date) >= midDate)
    );
    const previousIntensity = calcAvgIntensity(
      trainingSessions.filter((s) => {
        const d = new Date(s.date);
        return d >= startDate && d < midDate;
      })
    );

    updateComparisonElement(
      'intensityComparison',
      recentIntensity,
      previousIntensity,
      'vs prev period'
    );
  }

  // Update a single comparison element
  function updateComparisonElement(
    elementId,
    current,
    previous,
    label,
    isPercentage = false
  ) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (previous === 0 && current === 0) {
      el.innerHTML = '<span class="neutral">No change</span>';
      el.className = 'stat-comparison neutral';
      return;
    }

    let change;
    if (isPercentage) {
      change = current - previous;
    } else {
      change =
        previous > 0
          ? Math.round(((current - previous) / previous) * 100)
          : current > 0
            ? 100
            : 0;
    }

    const isPositive = change > 0;
    const isNeutral = change === 0;

    const arrow = isPositive ? '↑' : isNeutral ? '→' : '↓';
    const displayChange = isPercentage ? `${Math.abs(change)}pp` : `${Math.abs(change)}%`;

    el.innerHTML = `
      <span class="comparison-arrow">${arrow}</span>
      <span>${isNeutral ? 'No change' : displayChange}</span>
      <span class="comparison-text">${label}</span>
    `;
    el.className = `stat-comparison ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`;
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

  // ============================================
  // SKELETON LOADING FUNCTIONS
  // ============================================

  // Show skeleton loaders
  function showSkeletons() {
    const skeletonIds = [
      'performanceSkeleton',
      'intensitySkeleton',
      'matchResultsSkeleton',
      'weeklyActivitySkeleton',
      'goalsProgressSkeleton',
    ];

    skeletonIds.forEach((id) => {
      const skeleton = document.getElementById(id);
      if (skeleton) {
        skeleton.classList.remove('hidden');
      }
    });

    // Show skeleton state for stat values
    document.querySelectorAll('.stat-value').forEach((el) => {
      el.classList.add('skeleton');
      el.textContent = '';
    });
  }

  // Hide skeleton loaders
  function hideSkeletons() {
    const skeletonIds = [
      'performanceSkeleton',
      'intensitySkeleton',
      'matchResultsSkeleton',
      'weeklyActivitySkeleton',
      'goalsProgressSkeleton',
    ];

    skeletonIds.forEach((id) => {
      const skeleton = document.getElementById(id);
      if (skeleton) {
        skeleton.classList.add('hidden');
      }
    });
  }

  // ============================================
  // EMPTY STATE FUNCTIONS
  // ============================================

  // Check and show empty state if no data
  function checkEmptyState(trainingSessions, matches) {
    const emptyState = document.getElementById('emptyState');
    const analyticsDashboard = document.getElementById('analyticsDashboard');
    const statsOverview = document.querySelector('.stats-overview');
    const timeFilterContainer = document.querySelector('.time-filter-container');

    if (trainingSessions.length === 0 && matches.length === 0) {
      // Show empty state
      if (emptyState) emptyState.style.display = 'block';
      if (analyticsDashboard) analyticsDashboard.style.display = 'none';
      if (statsOverview) statsOverview.style.display = 'none';
      if (timeFilterContainer) timeFilterContainer.style.display = 'none';
      return true;
    } else {
      // Show dashboard
      if (emptyState) emptyState.style.display = 'none';
      if (analyticsDashboard) analyticsDashboard.style.display = 'flex';
      if (statsOverview) statsOverview.style.display = 'grid';
      if (timeFilterContainer) timeFilterContainer.style.display = 'flex';
      return false;
    }
  }

  // ============================================
  // ACHIEVEMENT HIGHLIGHTS FUNCTIONS
  // ============================================

  // Generate and display achievement highlights
  function updateAchievementHighlights(trainingSessions, matches) {
    const highlightsSection = document.getElementById('achievementHighlights');
    const highlightsList = document.getElementById('highlightsList');

    if (!highlightsSection || !highlightsList) return;

    const highlights = [];

    // Check for training milestones
    if (trainingSessions.length >= 100) {
      highlights.push({
        badge: '🏆',
        text: 'Century Club!',
        value: `${trainingSessions.length} sessions`,
      });
    } else if (trainingSessions.length >= 50) {
      highlights.push({
        badge: '⭐',
        text: 'Training Champion',
        value: `${trainingSessions.length} sessions`,
      });
    } else if (trainingSessions.length >= 25) {
      highlights.push({
        badge: '💪',
        text: 'Dedicated Athlete',
        value: `${trainingSessions.length} sessions`,
      });
    } else if (trainingSessions.length >= 10) {
      highlights.push({
        badge: '🌟',
        text: 'Getting Started',
        value: `${trainingSessions.length} sessions`,
      });
    }

    // Check for match milestones
    if (matches.length >= 50) {
      highlights.push({
        badge: '🎯',
        text: 'Match Master',
        value: `${matches.length} matches`,
      });
    } else if (matches.length >= 25) {
      highlights.push({
        badge: '🏸',
        text: 'Court Regular',
        value: `${matches.length} matches`,
      });
    } else if (matches.length >= 10) {
      highlights.push({
        badge: '🎮',
        text: 'Competitor',
        value: `${matches.length} matches`,
      });
    }

    // Check win rate
    const wins = matches.filter((m) => m.result?.toLowerCase() === 'win').length;
    const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

    if (winRate >= 75 && matches.length >= 10) {
      highlights.push({
        badge: '👑',
        text: 'Winning Streak',
        value: `${winRate}% win rate`,
      });
    } else if (winRate >= 60 && matches.length >= 10) {
      highlights.push({ badge: '🔥', text: 'On Fire!', value: `${winRate}% win rate` });
    }

    // Check for training streak (consecutive days in last 30 days)
    const streak = calculateTrainingStreak(trainingSessions);
    if (streak >= 7) {
      highlights.push({
        badge: '📈',
        text: 'Weekly Warrior',
        value: `${streak} day streak`,
      });
    } else if (streak >= 3) {
      highlights.push({ badge: '⚡', text: 'On a Roll', value: `${streak} day streak` });
    }

    // Check for high intensity training
    const highIntensitySessions = trainingSessions.filter((s) => {
      const intensity = parseInt(s.intensity);
      return !isNaN(intensity) && intensity >= 8;
    }).length;

    if (highIntensitySessions >= 10) {
      highlights.push({
        badge: '💥',
        text: 'Intensity Beast',
        value: `${highIntensitySessions} intense sessions`,
      });
    }

    // Only show if there are highlights
    if (highlights.length > 0) {
      highlightsSection.style.display = 'block';
      highlightsList.innerHTML = highlights
        .map(
          (h) => `
        <div class="highlight-item">
          <span class="highlight-badge">${h.badge}</span>
          <span class="highlight-text">${h.text} <span class="highlight-value">${h.value}</span></span>
        </div>
      `
        )
        .join('');
    } else {
      highlightsSection.style.display = 'none';
    }
  }

  // Calculate training streak
  function calculateTrainingStreak(trainingSessions) {
    if (trainingSessions.length === 0) return 0;

    // Get unique dates sorted descending
    const dates = [
      ...new Set(
        trainingSessions.map((s) => {
          const d = new Date(s.date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })
      ),
    ]
      .sort()
      .reverse();

    if (dates.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSessionDate = new Date(dates[0]);
    const daysSinceLastSession = Math.floor(
      (today - lastSessionDate) / (24 * 60 * 60 * 1000)
    );

    // If last session was more than 1 day ago, no current streak
    if (daysSinceLastSession > 1) return 0;

    // Count consecutive days
    for (let i = 1; i < dates.length; i++) {
      const current = new Date(dates[i - 1]);
      const previous = new Date(dates[i]);
      const diff = Math.floor((current - previous) / (24 * 60 * 60 * 1000));

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // ============================================
  // TIME FILTER FUNCTIONS
  // ============================================

  // Initialize time filter buttons
  function initTimeFilters() {
    const filterBtns = document.querySelectorAll('.time-filter-btn');

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        // Update active state
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Get period value
        const period = btn.dataset.period;
        currentPeriod = period === 'all' ? 'all' : parseInt(period);

        // Re-render charts with filtered data
        await renderWithCurrentPeriod();
      });
    });
  }

  // Render charts with current period filter
  async function renderWithCurrentPeriod() {
    showSkeletons();

    // Filter cached data by period
    const filteredSessions = filterByPeriod(cachedData.trainingSessions, currentPeriod);
    const filteredMatches = filterByPeriod(cachedData.matches, currentPeriod);

    // Update period labels
    const periodLabel = getPeriodLabel(currentPeriod);
    document.querySelectorAll('.chart-period').forEach((el) => {
      if (el.id) {
        el.textContent = periodLabel;
      }
    });

    // Destroy existing charts
    destroyCharts();

    // Check empty state
    if (checkEmptyState(filteredSessions, filteredMatches)) {
      hideSkeletons();
      return;
    }

    // Process and render with filtered data
    const performanceData = processPerformanceData(filteredSessions, filteredMatches);
    const intensityData = processIntensityData(filteredSessions);
    const matchResultsData = processMatchResults(filteredMatches);
    const weeklyActivityData = processWeeklyActivity(filteredSessions, filteredMatches);
    const goalsProgressData = processGoalsProgress(cachedData.goals); // Goals not filtered
    const insights = calculateInsights(filteredSessions, filteredMatches);

    // Update stats and charts
    updateStatsCards(filteredSessions, filteredMatches);
    updateAchievementHighlights(filteredSessions, filteredMatches);

    initPerformanceChart(performanceData, insights);
    initIntensityChart(intensityData);
    initMatchResultsChart(matchResultsData);
    initWeeklyActivityChart(weeklyActivityData);
    initGoalsProgressChart(goalsProgressData);

    hideSkeletons();
  }

  // Main function to load all data and initialize charts
  async function loadProgressData() {
    try {
      // Show skeleton loaders
      showSkeletons();

      // Get current user ID
      const currentUserId =
        auth.currentUser?.uid || sessionStorage.getItem('currentUserId');
      if (!currentUserId) {
        console.error('No user ID available');
        hideSkeletons();
        return;
      }

      console.log('Loading progress data for user:', currentUserId);

      // Fetch all data in parallel
      const [trainingSessions, matches, goals] = await Promise.all([
        fetchTrainingSessions(currentUserId),
        fetchMatches(currentUserId),
        fetchGoals(currentUserId),
      ]);

      // Cache the data for filtering
      cachedData = { trainingSessions, matches, goals };

      console.log('Data fetched:', {
        trainingSessions: trainingSessions.length,
        matches: matches.length,
        goals: goals.length,
      });

      // Check for empty state
      if (checkEmptyState(trainingSessions, matches)) {
        hideSkeletons();
        return;
      }

      // Update achievement highlights with all data
      updateAchievementHighlights(trainingSessions, matches);

      // Initialize time filters
      initTimeFilters();

      // Filter data by current period
      const filteredSessions = filterByPeriod(trainingSessions, currentPeriod);
      const filteredMatches = filterByPeriod(matches, currentPeriod);

      // Process data for charts
      const performanceData = processPerformanceData(filteredSessions, filteredMatches);
      const intensityData = processIntensityData(filteredSessions);
      const matchResultsData = processMatchResults(filteredMatches);
      const weeklyActivityData = processWeeklyActivity(filteredSessions, filteredMatches);
      const goalsProgressData = processGoalsProgress(goals);
      const insights = calculateInsights(filteredSessions, filteredMatches);

      // Update stats cards
      updateStatsCards(filteredSessions, filteredMatches);

      // Initialize all charts with real data
      initPerformanceChart(performanceData, insights);
      initIntensityChart(intensityData);
      initMatchResultsChart(matchResultsData);
      initWeeklyActivityChart(weeklyActivityData);
      initGoalsProgressChart(goalsProgressData);

      console.log('All charts initialized with real data');

      // Hide skeleton loaders
      hideSkeletons();
    } catch (error) {
      console.error('Error loading progress data:', error);
      hideSkeletons();

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
