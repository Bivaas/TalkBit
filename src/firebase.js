// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN7-gZyqCSn__Frq5YgfR9Z7ucNDNZMWM",
  authDomain: "notice-2eca2.firebaseapp.com",
  projectId: "notice-2eca2",
  storageBucket: "notice-2eca2.firebasestorage.app",
  messagingSenderId: "108701993463",
  appId: "1:108701993463:web:75ab557c841f4b9e08c6f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Admin email - hardcoded for security
export const ADMIN_EMAIL = "admin@notice.com";

export { db, auth };
