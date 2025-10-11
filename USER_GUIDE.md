# 🏸 ShuttleStats User Guide

Welcome to **ShuttleStats** — your comprehensive badminton performance tracking platform! This guide will help you get started and make the most of all features available to both players and coaches.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Player Features](#player-features)
3. [Coach Features](#coach-features)
4. [Common Tasks](#common-tasks)
5. [FAQs](#faqs)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Creating Your Account

1. **Visit ShuttleStats**: Navigate to [shuttlestats.vercel.app](https://shuttlestats.vercel.app/)
2. **Click "Sign Up"**: On the login page, click the "Create Account" link
3. **Fill in Your Details**:
   - **First Name** and **Last Name**: Your full name
   - **Email**: A valid email address (will be your username)
   - **Password**: Must contain at least 8 characters, including uppercase letters and numbers
   - **Confirm Password**: Re-enter your password
4. **Select Your Role**:
   - **Player**: If you're an athlete tracking your own performance
   - **Coach**: If you're managing and monitoring players
5. **Optional - Add Coach** (Players only):
   - Enter your coach's email address to send a connection request
   - Your coach must have a ShuttleStats account with the "Coach" role
6. **Click "Sign Up"**: Complete the registration process

### Logging In

1. **Enter Your Credentials**:
   - Email address
   - Password
2. **Click "Sign In"** or use **"Sign in with Google"** for quick access
3. **Stay Logged In**: Your session will persist until you sign out

### First-Time Setup

After logging in for the first time:

- **Players**: You'll see your personal dashboard with quick action buttons
- **Coaches**: You'll see the coach dashboard with an empty player roster

---

## 👤 Player Features

### 1. Personal Dashboard

**Location**: `player-dashboard.html`

Your dashboard provides an at-a-glance view of your performance:

#### Key Metrics

- **Training Sessions**: Total number of sessions logged
- **Matches Played**: Total competitive matches
- **Improvement Rate**: Calculated performance improvement percentage
- **Goals Achieved**: Number of completed goals
- **Best Win Streak**: Longest consecutive match wins

#### Recent Activity

- View your latest training sessions, matches, and goals
- Activities are sorted by most recent first
- Quick links to detailed views

#### Coach Invitations

- Accept or decline coach connection requests
- Notifications appear automatically when you have pending invitations

#### Quick Actions

- **Log Training**: Record a new training session
- **Record Match**: Log a competitive match result
- **Set Goal**: Create a new performance goal
- **Add Event**: Schedule a training or match event

### 2. Training Sessions

**Location**: `training.html`

Track all your training activities with detailed information.

#### Logging a Training Session

1. Click **"Log Training Session"** button
2. Fill in the form:
   - **Date**: When the session occurred
   - **Duration**: Length of session (in minutes)
   - **Type**: Choose from Drills, Match Play, Conditioning, or Technique
   - **Intensity**: Rate from 1-10 (scale below)
   - **Notes**: Optional observations or highlights
3. Click **"Save Training Session"**

#### Intensity Scale Guide

- **1-3 (Light)**: Warm-up, technique work, light drills
- **4-6 (Moderate)**: Standard practice, moderate-intensity drills
- **7-8 (Intense)**: High-intensity drills, competitive practice
- **9-10 (Extreme)**: Maximum effort, tournament simulation

#### Viewing Training History

- All sessions display as cards showing:
  - Date and duration
  - Training type and intensity level
  - Color-coded intensity indicator
  - Your notes
  - Coach feedback (if provided)
- Edit or delete any session using the action buttons

### 3. Match Tracking

**Location**: `matches.html`

Record and analyze your competitive matches.

#### Recording a Match

1. Click **"Record Match"** button
2. Complete the match details:
   - **Date**: Match date
   - **Opponent**: Name of your opponent
   - **Match Type**: Singles or Doubles
   - **Result**: Win, Loss, or Draw
   - **Your Score**: Your game scores (e.g., "21-18, 21-19")
   - **Opponent Score**: Opponent's scores
   - **Notes**: Match observations or key moments
3. Click **"Save Match"**

#### Match Statistics

- **Total Matches**: Count of all matches logged
- **Win Rate**: Percentage of matches won
- **Recent Form**: Overview of your last 5 match results

#### Coach Feedback

- Coaches can provide feedback on your matches
- Feedback appears in the match card below your notes
- Real-time updates when coach adds new feedback

### 4. Goal Setting

**Location**: `goals.html`

Set, track, and achieve your badminton objectives.

#### Creating a Goal

1. Click **"Set New Goal"** button
2. Define your goal:
   - **Goal Title**: Brief description (e.g., "Improve smash accuracy")
   - **Description**: Detailed explanation
   - **Category**: Choose from Skill, Fitness, Competitive, or Other
   - **Priority**: Low, Medium, or High
   - **Target Date**: When you aim to achieve this goal
   - **Status**: Not Started, In Progress, or Completed
3. Click **"Save Goal"**

#### Goal Management

- View all goals with color-coded priority indicators
- See days remaining until target date
- Edit goals to update status and progress
- Delete goals that are no longer relevant
- Goals are automatically organized by status

### 5. Schedule & Calendar

**Location**: `schedule.html`

Organize your training sessions, matches, and events.

#### Two View Modes

**List View**

- Chronological list of all events
- Grouped by date
- Easy to scan upcoming activities

**Calendar View**

- Monthly calendar grid
- Events marked on specific dates
- Click any date to see that day's events
- Navigate between months using arrow buttons

#### Adding an Event

1. Click **"Add Event"** button
2. Fill in event details:
   - **Title**: Event name
   - **Date**: When it occurs
   - **Time**: Start time (optional)
   - **Type**: Training or Match
   - **Location**: Where it takes place (optional)
   - **Notes**: Additional information
3. Click **"Save Event"**

#### Event Statistics

- **Upcoming Events**: Count of scheduled activities
- **This Week**: Events in the next 7 days
- **Training/Matches**: Breakdown by type

### 6. Progress & Analytics

**Location**: `progress.html`

Visualize your performance with interactive charts and insights.

#### Dashboard Statistics

- **Total Sessions**: Cumulative training count
- **Total Matches**: All competitive matches
- **Win Rate**: Match success percentage
- **Average Intensity**: Mean training intensity level

#### Performance Charts

**1. Performance Trends (Line Chart)**

- Tracks training sessions and match results over 6 months
- Blue line: Training frequency
- Green line: Match wins
- Identifies performance patterns and trends

**2. Training Intensity Distribution (Doughnut Chart)**

- Shows breakdown of training by intensity level:
  - Light (1-3): Blue
  - Moderate (4-6): Green
  - Intense (7-8): Orange
  - Extreme (9-10): Red
- Helps balance training load

**3. Match Results (Pie Chart)**

- Win/Loss/Draw distribution
- Color-coded: Green (Wins), Red (Losses), Gray (Draws)
- Visual win rate representation

**4. Weekly Activity (Bar Chart)**

- Compares training sessions vs. matches by week
- Shows activity consistency
- Identifies training patterns

**5. Goals Progress (Horizontal Bar Chart)**

- Displays completion percentage for active goals
- Color-coded by goal status
- Quick progress overview

#### Performance Insights

- **Current Trend**: Analysis of recent performance direction
- **Best Streak**: Longest consecutive achievements
- **Suggested Focus**: Personalized recommendations

### 7. Profile Management

**Location**: `profile.html`

Manage your account information and preferences.

#### Viewing Your Profile

- **Profile Avatar**: Displays your initials
- **Full Name**: First and last name
- **Email Address**: Login email (cannot be changed here)
- **Role**: Player or Coach designation
- **Member Since**: Account creation date
- **Coach Information**: Shows assigned coach details (players only)

#### Editing Your Profile

1. Click **"Edit Profile"** button
2. Update editable fields:
   - First Name
   - Last Name
3. Click **"Save Changes"** to update
4. Click **"Cancel"** to discard changes

**Note**: Name changes automatically update throughout the app, including the header greeting.

### 8. Navigation

#### Sidebar Menu (Players)

- **Dashboard**: Main overview page
- **Training**: Log and view training sessions
- **Matches**: Record and analyze matches
- **Goals**: Set and track objectives
- **Schedule**: Calendar and event management
- **Progress**: Analytics and performance charts
- **Profile**: Account information

#### Header Options

- **Welcome Message**: Displays your name
- **Settings Dropdown**: Access profile and logout
- **Menu Toggle**: Show/hide sidebar on mobile

---

## 👥 Coach Features

### 1. Coach Dashboard

**Location**: `coach-dashboard.html`

Central hub for managing all your players.

#### Player Selection

- Dropdown menu lists all your connected players
- Select a player to view their detailed performance data
- Dashboard updates automatically when switching players

#### Key Performance Indicators (KPIs)

**Training Commitment**

- Shows selected player's training frequency
- Recent training session count
- Consistency metrics

**Current Focus**

- Displays player's active goals
- Goal priorities and deadlines
- Progress indicators

#### Quick Views

- **Recent Training**: Last 5 training sessions
- **Upcoming Matches**: Next scheduled matches
- **Current Goals**: Active objectives with status

### 2. Player Management ("My Players")

**Location**: `my-players.html`

Manage your coaching roster and player connections.

#### Adding Players

1. Click **"Add Player"** button
2. Enter the player's registered email address
3. Click **"Send Invitation"**
4. Player receives notification and can accept/decline
5. Once accepted, player appears in your roster

**Important**: The email must match an existing ShuttleStats player account.

#### Player Cards

Each player card displays:

- Player name and avatar
- Status: Active or Pending
- Quick action buttons
- Link to detailed player view

#### Managing Players

- **View Details**: Click card to see full player data
- **Cancel Invitation**: Remove pending invitations
- **Remove Player**: End coaching relationship
  - Note: This doesn't delete player data, only disconnects them from your roster

#### Player Statistics

- **Total Players**: Count of all connected players
- **Active Players**: Currently connected players
- **Pending**: Awaiting invitation acceptance

### 3. Player-Specific Views

As a coach, you can access detailed views for each player:

#### Training Sessions View

- See all training sessions logged by the player
- Add feedback to any session
- Edit sessions on behalf of the player (if needed)
- View training statistics and patterns

#### Match History View

- Access complete match records
- Provide post-match feedback
- Track player's competitive performance
- Analyze win/loss patterns

#### Goals Tracking View

- View all player goals
- Monitor goal progress
- Update goal status
- Add motivational feedback

#### Schedule View

- See player's upcoming events
- Coordinate training sessions
- Schedule matches
- Manage event calendar

### 4. Providing Feedback

#### Training Feedback

1. Navigate to player's training page
2. Find the session you want to comment on
3. Click **"Add Feedback"** in the session card
4. Type your feedback in the text area
5. Click **"Submit Feedback"**
6. Player sees feedback immediately in their view

#### Match Feedback

1. Open player's match history
2. Locate the specific match
3. Click **"Add Feedback"**
4. Provide analysis, encouragement, or suggestions
5. Submit feedback
6. Feedback appears in player's match card

### 5. Creating Data for Players

Coaches can create records on behalf of their players:

#### Log Training Session

1. Select player from dashboard dropdown
2. Navigate to Training page
3. Click **"Log Training Session"**
4. Fill form with player's training details
5. Save — session appears in player's history

#### Record Match

1. Select player
2. Go to Matches page
3. Click **"Record Match"**
4. Enter match details
5. Save — match added to player's record

#### Set Goal

1. Select player
2. Navigate to Goals page
3. Click **"Set New Goal"**
4. Define goal parameters
5. Save — goal appears for player

### 6. Coach Navigation

#### Sidebar Menu (Coaches)

- **Coach Dashboard**: Main coaching hub
- **My Players**: Player roster management
- **Training**: View selected player's training
- **Matches**: Access player match records
- **Goals**: Monitor player objectives
- **Schedule**: Event coordination
- **Profile**: Your account settings

---

## 🔄 Common Tasks

### Switching Between Views (Coaches)

1. Use the **player dropdown** in the coach dashboard
2. Select a player from the list
3. All data views automatically update to show that player's information
4. Navigate to different sections (Training, Matches, etc.) to see detailed data

### Editing Existing Data

1. Find the item you want to edit (training session, match, goal, etc.)
2. Click the **Edit** button (pencil icon)
3. Modal opens with current data pre-filled
4. Make your changes
5. Click **"Save Changes"**

### Deleting Data

1. Locate the item to delete
2. Click the **Delete** button (trash icon)
3. Confirm deletion in the popup dialog
4. Item is permanently removed

### Responding to Coach Invitations (Players)

1. Log into your dashboard
2. Invitation notification appears automatically at the top
3. Read the invitation from the coach
4. Click **"Accept"** to connect with the coach
5. Click **"Decline"** to reject the invitation
6. Once accepted, coach can view and manage your data

### Signing Out

1. Click your name or avatar in the top-right header
2. Settings dropdown menu appears
3. Click **"Logout"**
4. You're signed out and redirected to the login page

---

## ❓ FAQs

### General Questions

**Q: Is ShuttleStats free to use?**  
A: Yes, ShuttleStats is completely free. It's a school project designed for educational purposes.

**Q: Can I use ShuttleStats on my mobile device?**  
A: Absolutely! ShuttleStats is fully responsive and works seamlessly on smartphones and tablets.

**Q: Is my data secure?**  
A: Yes. ShuttleStats uses Firebase Authentication and implements strict Firestore security rules. You can only access your own data (or your players' data if you're a coach).

**Q: Can I have multiple coaches?**  
A: Currently, players can connect with one coach at a time. This may be expanded in future updates.

**Q: Can coaches compete as players?**  
A: Your account role is set during registration. If you want to use both roles, you would need separate accounts.

### Player-Specific Questions

**Q: How do I connect with my coach?**  
A: There are two ways:

1. Enter your coach's email during registration
2. Wait for your coach to send you an invitation, then accept it from your dashboard

**Q: Can I change my training session after logging it?**  
A: Yes! Click the Edit button on any training card to modify the details.

**Q: What if I disagree with my coach's feedback?**  
A: You can discuss it with your coach directly. Feedback is meant to be constructive and help you improve.

**Q: Can I see my improvement over time?**  
A: Yes! Visit the Progress page to see detailed charts and analytics showing your performance trends.

**Q: How is improvement rate calculated?**  
A: The improvement rate considers your recent match win rate, training frequency, and goal achievement compared to earlier periods.

### Coach-Specific Questions

**Q: How do I add a player to my roster?**  
A: Go to "My Players", click "Add Player", and enter their registered email address. They'll receive an invitation to connect.

**Q: Can I log training sessions for my players?**  
A: Yes! Select the player from your dashboard, navigate to Training, and log sessions on their behalf.

**Q: What if a player declines my invitation?**  
A: The invitation is removed, and you won't be able to access their data. You can send a new invitation if needed.

**Q: Can I see all my players' data at once?**  
A: Currently, you view one player at a time. Use the dropdown to switch between players quickly.

**Q: What happens if I remove a player from my roster?**  
A: The coaching connection is ended, but no data is deleted. The player keeps all their records, and you lose access to their information.

### Technical Questions

**Q: Why can't I log in with Google?**  
A: Ensure you're using a stable internet connection. If the problem persists, try clearing your browser cache or using email/password login.

**Q: My data isn't updating. What should I do?**  
A: Try refreshing the page. ShuttleStats uses real-time updates, but occasionally a refresh helps sync data.

**Q: Can I export my data?**  
A: Direct data export isn't currently available, but this feature may be added in future versions.

**Q: I forgot my password. How do I reset it?**  
A: Password reset functionality is not yet implemented. Contact support or create a new account if necessary.

---

## 🔧 Troubleshooting

### Login Issues

**Problem**: Can't log in with email/password  
**Solutions**:

- Verify your email address is correct
- Check that Caps Lock is off when typing password
- Ensure password meets requirements (8+ characters, uppercase, numbers)
- Try the "Sign in with Google" option

**Problem**: "User not found" error  
**Solutions**:

- Verify you've created an account
- Double-check the email address
- Try registering if you haven't already

### Data Not Appearing

**Problem**: Training sessions, matches, or goals not showing  
**Solutions**:

- Refresh the page
- Check that you're logged in
- Verify you're on the correct page
- Clear browser cache and cookies
- Check your internet connection

**Problem**: Coach can't see player data  
**Solutions**:

- Ensure player has accepted the invitation
- Verify you've selected the player from the dropdown
- Confirm the player account role is "Player"
- Refresh the page

### Coach-Player Connection Issues

**Problem**: Player didn't receive coach invitation  
**Solutions**:

- Verify you entered the correct email address
- Ensure the email matches a registered player account
- Ask player to check their dashboard notifications
- Player should log out and log back in

**Problem**: Can't add player to roster  
**Solutions**:

- Confirm the email belongs to an existing player account
- Check that the player hasn't already connected with another coach
- Verify you're logged in as a coach
- Try again after refreshing the page

### Performance Issues

**Problem**: Page loads slowly  
**Solutions**:

- Check your internet connection speed
- Close unnecessary browser tabs
- Clear browser cache
- Try a different browser
- Disable browser extensions temporarily

**Problem**: Charts not displaying on Progress page  
**Solutions**:

- Ensure you have logged some data (training, matches, goals)
- Refresh the page
- Check browser console for errors (F12)
- Try a different browser

### Edit/Delete Issues

**Problem**: Can't edit or delete items  
**Solutions**:

- Verify you're the owner of the data (or the player's coach)
- Check that you're logged in
- Try refreshing the page
- Ensure you're not in a restricted view

**Problem**: Changes not saving  
**Solutions**:

- Check your internet connection
- Verify all required fields are filled
- Look for error messages on the form
- Try logging out and back in

### Display Issues

**Problem**: Layout looks broken on mobile  
**Solutions**:

- Try rotating your device
- Zoom out/in to reset view
- Clear browser cache
- Update your mobile browser

**Problem**: Buttons or links not working  
**Solutions**:

- Try clicking again
- Refresh the page
- Check JavaScript is enabled in browser
- Try a different browser

### Browser Compatibility

**Recommended Browsers**:

- Google Chrome (latest version)
- Mozilla Firefox (latest version)
- Safari (latest version)
- Microsoft Edge (latest version)

**Not Recommended**:

- Internet Explorer (not supported)
- Very old browser versions

### Still Having Issues?

If you continue experiencing problems:

1. **Check Browser Console**: Press F12 and look for error messages in the Console tab
2. **Clear Everything**: Clear all browser data (cache, cookies, local storage)
3. **Try Incognito Mode**: Test in a private/incognito browser window
4. **Different Device**: Try accessing from another device
5. **Update Browser**: Ensure your browser is up to date

### Getting Help

For persistent technical issues:

- Check the GitHub repository for known issues
- Review the technical documentation
- Contact the development team through the repository

---

## 🎯 Tips for Success

### For Players

1. **Log Consistently**: Record every training session and match for accurate analytics
2. **Be Detailed**: Add notes to sessions and matches to track what worked
3. **Set SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
4. **Review Analytics**: Check your Progress page weekly to identify trends
5. **Rate Intensity Accurately**: Use the full 1-10 scale for better insights
6. **Communicate**: Respond to coach feedback and invitations promptly

### For Coaches

1. **Provide Timely Feedback**: Comment on sessions and matches soon after they occur
2. **Be Constructive**: Offer specific, actionable advice in feedback
3. **Monitor Trends**: Use analytics to identify player patterns and needs
4. **Set Regular Check-ins**: Review player progress consistently
5. **Coordinate Schedules**: Keep events updated so players stay organized
6. **Encourage Goal Setting**: Help players establish and work toward objectives

---

## 📚 Additional Resources

- **README.md**: Project overview and technical setup
- **TECHNICAL_DOCUMENTATION.md**: Architecture and database schema
- **API_DOCUMENTATION.md**: Firebase integration details
- **GitHub Repository**: [github.com/JerbyCalo/ShuttleStats](https://github.com/JerbyCalo/ShuttleStats)
- **Live Demo**: [shuttlestats.vercel.app](https://shuttlestats.vercel.app)

---

## 📝 Feedback and Support

ShuttleStats is continuously improving! If you have:

- Feature suggestions
- Bug reports
- Questions or comments

Please open an issue on the GitHub repository or contact the development team.

---

**Happy Tracking! 🏸**

_Last Updated: October 12, 2025_
