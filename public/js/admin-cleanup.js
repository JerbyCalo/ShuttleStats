// Admin Cleanup Utility
// This script helps with development cleanup - removing both Auth users and Firestore data

import {
  auth,
  db,
  signInWithEmailAndPassword,
  deleteUser,
  collection,
  getDocs,
  doc,
  deleteDoc,
  writeBatch,
} from '../config/firebase-config.js';

class AdminCleanup {
  constructor() {
    this.isAuthenticated = false;
  }

  // Authenticate as admin (you need to create an admin account first)
  async authenticateAdmin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.isAuthenticated = true;
      console.log('Admin authenticated successfully');
      return userCredential.user;
    } catch (error) {
      console.error('Failed to authenticate admin:', error);
      throw error;
    }
  }

  // Delete current authenticated user (including from Auth)
  async deleteCurrentUser() {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      const userId = auth.currentUser.uid;

      // Delete Firestore document first
      await this.deleteUserDocument(userId);

      // Delete from Firebase Auth
      await deleteUser(auth.currentUser);

      console.log('User deleted successfully from both Auth and Firestore');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Delete user document from Firestore
  async deleteUserDocument(userId) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      console.log(`User document ${userId} deleted from Firestore`);
    } catch (error) {
      console.error('Error deleting user document:', error);
      throw error;
    }
  }

  // Clean up all collections (Firestore only)
  async cleanupAllCollections() {
    const collections = [
      'users',
      'training',
      'matches',
      'goals',
      'schedule',
      'coach_players',
      'feedback',
    ];

    for (const collectionName of collections) {
      await this.deleteCollection(collectionName);
    }

    console.log('All collections cleaned up');
  }

  // Delete entire collection
  async deleteCollection(collectionName) {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      if (snapshot.empty) {
        console.log(`Collection ${collectionName} is already empty`);
        return;
      }

      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
        count++;
      });

      await batch.commit();
      console.log(`Deleted ${count} documents from ${collectionName} collection`);
    } catch (error) {
      console.error(`Error deleting collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Get all users (for inspection)
  async getAllUsers() {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];

      usersSnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      console.log('All users in Firestore:', users);
      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }
}

// Create global instance
window.AdminCleanup = new AdminCleanup();

console.log('Admin cleanup utility loaded. Use window.AdminCleanup in console.');
console.log('Example usage:');
console.log('1. await AdminCleanup.authenticateAdmin("admin@example.com", "password")');
console.log('2. await AdminCleanup.cleanupAllCollections()');
console.log(
  '3. await AdminCleanup.deleteCurrentUser() // deletes current signed-in user'
);
