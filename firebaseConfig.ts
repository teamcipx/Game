
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcw5bLzk-3D0C1V2Ux78Oj7z9oqohlXWA",
  authDomain: "runiigame.firebaseapp.com",
  projectId: "runiigame",
  storageBucket: "runiigame.firebasestorage.app",
  messagingSenderId: "631589031654",
  appId: "1:631589031654:web:f455b120a6bd4d0f0a3527"
};

// Initialize Firebase
let app;
let auth: any = null;
let db: any = null;

try {
    // Use modular import directly
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
} catch (e) {
    console.error("Firebase initialization error:", e);
}

export { auth, db };
