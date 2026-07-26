// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "REMOVED_API_KEY",
  authDomain: "to-do-list-ea02b.firebaseapp.com",
  projectId: "to-do-list-ea02b",
  storageBucket: "to-do-list-ea02b.firebasestorage.app",
  messagingSenderId: "104305496767",
  appId: "1:104305496767:web:dd220456c91bbfff7e6c0a",
  measurementId: "G-83P9F7PSW0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = initializeFirestore(app, {
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(), // ✅ แก้ปัญหา multi-tab ได้เลย
  }),
});

if (typeof window !== "undefined") {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalhost) {
    // 🖥️ ถ้าทำงานบนเครื่องเรา -> ต่อเข้า Emulator
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    console.log("⚡ Connected to Firebase Emulator Suite");
    alert("⚡ Connected to Firebase Emulator Suite");
  }  else {
    // ✅ Analytics เปิดแค่ตอน production จริงๆ
    getAnalytics(app);
   
  }
 

}

export { db, app, auth };
