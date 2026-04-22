// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9E1su-kjrXPfFhl-XGRRWyvW7n9LXUII",
  authDomain: "to-do-list-ea02b.firebaseapp.com",
  projectId: "to-do-list-ea02b",
  storageBucket: "to-do-list-ea02b.firebasestorage.app",
  messagingSenderId: "104305496767",
  appId: "1:104305496767:web:dd220456c91bbfff7e6c0a",
  measurementId: "G-83P9F7PSW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
connectAuthEmulator(auth, "http://127.0.0.1:9099");

const db = getFirestore();
connectFirestoreEmulator(db, '127.0.0.1', 8080);

export { db,app ,auth};