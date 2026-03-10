import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDD_d3KPkf85sAzH8Le90-XnSlwSuZmUww",
  authDomain: "junaklms.firebaseapp.com",
  projectId: "junaklms",
  storageBucket: "junaklms.firebasestorage.app",
  messagingSenderId: "144232116057",
  appId: "1:144232116057:web:b9b90259bbb7a3982b2648",
  measurementId: "G-9TFEFWKWLR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
