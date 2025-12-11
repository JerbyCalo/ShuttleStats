# 🏸 ShuttleStats

A modern, full-stack badminton performance tracker for players and coaches. Built with vanilla JavaScript, Firebase, and deployed on Vercel.

## 🌐 Live Demo

https://shuttlestats.vercel.app/

## ✨ Features

### 🔐 Authentication & User Management

- **Role-Based Registration & Login:** Sign up as a `Player` or `Coach`
- **Secure Firebase Authentication:** Email/Password and Google sign-in options
- **Session Management:** Persistent login state with secure session storage

### 👤 Player Experience

- **Personal Dashboard:** Overview of recent activity, stats, and progress
- **Training Session Tracking:** Log and review all training sessions with full CRUD operations
- **Match History:** Record competitive matches, track wins/losses, and analyze performance
- **Goal Setting:** Set, track, and manage personal badminton goals
- **Schedule View:** Calendar and list views of upcoming training and matches
- **Progress & Analytics:** Visualize performance trends and improvements over time
- **Achievement System:** (Placeholder for future development)

### 👥 Coach Experience

- **Coach Dashboard:** Overview of all managed players with summarized data
- **Player Management ("My Players"):** Add/remove players from your coaching roster
- **Player-Specific Views:** Drill down into any player's full data (Training, Matches, Goals, Schedule)
- **Management Modals:** Create and edit training sessions, matches, and goals on behalf of your players
- **Role-Based Navigation:** Dedicated sidebar with coach-specific menu items (Player Management, Analytics)

### 🛠️ Technical Features

- **Real-Time Firebase Firestore Database:** Live data synchronization across all devices
- **Advanced Firestore Security Rules:** Ensures users can only access their own data (or their players'/coach's data)
- **Responsive UI:** Works seamlessly on desktop, tablet, and mobile devices
- **Dynamic Role-Based UI:** Interface and navigation change based on user role
- **Interactive Modals:** Unified modal system for all Create, Read, Update, Delete (CRUD) operations
- **Toast Notifications:** User feedback for successful actions and errors
- **Loading & Empty States:** Polished UX for all data-fetching scenarios

## 🗂️ Project Structure

```
ShuttleStats/
|
│   build.js
│   README.md
│
├───public
│   │   achievement.html
│   │   coach-dashboard.html
│   │   favicon.ico
│   │   goals.html
│   │   index.html
│   │   login.html
│   │   matches.html
│   │   my-players.html
│   │   player-dashboard.html
│   │   progress.html
│   │   schedule.html
│   │   training.html
│   │
│   ├───assets
│   │   └───icons
│   │
│   ├───config
│   │
│   ├───css
│   │
│   └───js
```

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+ Modules), HTML5, CSS3
- **Backend:** Firebase Firestore (NoSQL Database)
- **Authentication:** Firebase Authentication
- **Hosting:** Vercel
- **Architecture:** Multi-Page Application (MPA) with role-aware UI

### Key Technical Implementation Details:

- **Firebase Security Rules:** Custom rules enforce data isolation. Coaches can only manage their players' data; players can only access their own data.
- **Coach-Player Relationship System:** coaches can send invitations; players can accept, linking their account to the coach.
- **Real-time Listeners:** Live updates for all data types create a dynamic user experience.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (ES modules are enabled in this project)
- npm 9+ (bundled with recent Node releases)
- Firebase project with Firestore + Authentication enabled
- Modern browser (Chrome, Firefox, Safari, Edge)

### Local Development

1. **Install dependencies**

```bash
git clone https://github.com/JerbyCalo/ShuttleStats
cd ShuttleStats
npm install
```

2. **Configure Firebase locally**
   - Copy your Firebase config into `public/config/firebase-config.js` (replace the production values if you are testing).
   - Run `firebase init firestore` (optional) or keep using the provided `public/config/firestore.rules` file.
   - To validate rule changes before deploying, run `npm run test:rules` (uses `@firebase/rules-unit-testing`).

3. **Serve the static files**
   - Open `public/login.html` directly in the browser **or**
   - Use any static server (for example `npx serve public`) to mimic the Vercel setup.

### Available npm Scripts

- `npm run lint` – Lints `public/js` and config files with ESLint 9.
- `npm run format` / `npm run format:check` – Formats or verifies formatting with Prettier 3.
- `npm run test:rules` – Executes Firestore security rule tests (requires the Firebase emulator suite).
- `npm run deploy:indexes` – Deploys Firestore indexes via the Firebase CLI.
- `npm run backfill:sessionStart` – Runs the utility in `tools/backfill-sessionStart.mjs` (set `PROJECT_ID`).

### Build & Deployment

1. **Local build output**

```bash
npm install
node build.js
```

This copies everything from `public/` into `dist/`, matching the structure Vercel serves.

2. **Deploy to Vercel**
   - Push to GitHub and import the repo in [Vercel](https://vercel.com/).
   - Use `public` (lowercase) as the root directory because the project is fully static.
   - `vercel.json` already injects security headers and redirects `/` to `/index.html`.

## 📖 Usage

1.  **Visit the live site** or open `public/login.html` locally.
2.  **Create an account** as either a Player or a Coach.
3.  **Players:** Start logging training sessions, matches, and goals.
4.  **Coaches:** Go to "My Players" to add players via their email address. Once added, you can view and manage all their data.
5.  **Explore** the different sections using the role-specific navigation sidebar.

## 🔒 Security & Data Isolation

The application implements robust security rules ensuring:

- Users can only read/write their own data in the `users` collection.
- Coaches can only see and manage data for players in their roster.
- Players can only see data associated with their own user ID.
- All operations are validated against the authenticated user's UID.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Contributing

This is a school project. Feel free to explore the codebase for learning purposes. Issues and pull requests are welcome for educational discussion.
