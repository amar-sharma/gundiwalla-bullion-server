// src/app/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";


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

// Initialize App Check with reCAPTCHA Enterprise
if (typeof window !== 'undefined') {
  try {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LdFxRwsAAAAAGd8w8sQzNNLovpyc8l_VmEwE5g1'),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ App Check initialized successfully with reCAPTCHA Enterprise');
  } catch (error) {
    console.error('❌ Failed to initialize App Check:', error);
    console.error('Please ensure:');
    console.error('1. reCAPTCHA Enterprise API is enabled in Google Cloud Console');
    console.error('2. The site key is correctly configured in Firebase Console');
    console.error('3. Your domain is added to the allowed domains list');
  }
}

const auth = getAuth(app);
const db = getFirestore(app, "bullion");
const functions = getFunctions(app, 'asia-south1');

export { auth, db, functions };
