// public/config/firebase-config.js
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
  apiKey: "AIzaSyB-sxV9R1gHmXPRcetDft9c7XGBfncwVlk",
  authDomain: "shuttlestats-c07d0.firebaseapp.com",
  projectId: "shuttlestats-c07d0",
  storageBucket: "shuttlestats-c07d0.firebasestorage.app",
  messagingSenderId: "455417621783",
  appId: "1:455417621783:web:c2d1d6d3517951fd37db52"
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
