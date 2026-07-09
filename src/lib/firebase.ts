import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBU0nmtep9mYWvXVkOfeyeG9ps7KwqDRco",
  authDomain: "ramdhenuleadsmanagement.firebaseapp.com",
  projectId: "ramdhenuleadsmanagement",
  storageBucket: "ramdhenuleadsmanagement.firebasestorage.app",
  messagingSenderId: "684661650858",
  appId: "1:684661650858:web:d5162cf408492154a167d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
