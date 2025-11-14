// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration (from user)
const firebaseConfig = {
  apiKey: "AIzaSyDU2drtPSX-CvI_r_may7isLlo3rsZMG8o",
  authDomain: "chat-f3a19.firebaseapp.com",
  projectId: "chat-f3a19",
  storageBucket: "chat-f3a19.firebasestorage.app",
  messagingSenderId: "727726169482",
  appId: "1:727726169482:web:015bc5af2cb32576377c73",
  measurementId: "G-MTYYZ5XDP1",
  databaseURL: "https://chat-f3a19-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);

// Admin email - hardcoded for security
export const ADMIN_EMAIL = "admin@chatapp.com";

export { db, auth, rtdb };
