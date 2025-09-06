// Public/config/firebase-config.js
// ShuttleStats v2 - Firebase Configuration (Single Project)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// PRODUCTION config
const firebaseConfig = {
  apiKey: "AIzaSyDZ_68qJDn3memHM1b4-foEWf90x_RdXGU",
  authDomain: "shuttlestats-prod-75e43.firebaseapp.com",
  projectId: "shuttlestats-prod-75e43",
  storageBucket: "shuttlestats-prod-75e43.firebasestorage.app",
  messagingSenderId: "705451198901",
  appId: "1:705451198901:web:d0c3d77b8db73f0f8e71fc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Init services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export Firebase services
export {
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getCountFromServer,
};

// Global auth state
window.currentUser = null;
window.currentUserData = null;

// Auth listener
onAuthStateChanged(auth, async (user) => {
  window.currentUser = user;

  if (user) {
    console.log("User is signed in:", user.email);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        window.currentUserData = { id: user.uid, ...userDoc.data() };
        console.log("User data loaded:", window.currentUserData);
        if (
          window.currentUserData.role === "player" &&
          window.checkPendingInvitations
        ) {
          console.log("Checking pending invitations for player…");
          window.checkPendingInvitations();
        }
      } else {
        console.log("No user document found in Firestore");
        window.currentUserData = null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      window.currentUserData = null;
    }
  } else {
    console.log("User is signed out");
    window.currentUserData = null;
  }

  window.dispatchEvent(
    new CustomEvent("authStateChanged", {
      detail: { user, userData: window.currentUserData },
    })
  );
});
