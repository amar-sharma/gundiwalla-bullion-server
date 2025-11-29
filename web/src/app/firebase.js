// src/app/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIaep4HeDqzosRIG3gk8Q5On3KMZLditY",
  authDomain: "gundiwalla-bullion.firebaseapp.com",
  projectId: "gundiwalla-bullion",
  storageBucket: "gundiwalla-bullion.firebasestorage.app",
  messagingSenderId: "58900984713",
  appId: "1:58900984713:web:43568ff7a170205d57a758"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "bullion");
const functions = getFunctions(app, 'asia-south1');

export { auth, db, functions };
