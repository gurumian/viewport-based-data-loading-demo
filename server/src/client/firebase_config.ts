// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { apiServer } from "./config";
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// const authDomain = apiServer;
// const authDomain = 'https://toktoktalk.com';

const firebaseConfig = {
  apiKey: "AIzaSyAxwV_E0MnI0Tq6t8y6sBtaL1Joy4A4XvI",
  authDomain: "toktoktalk-a52ce.firebaseapp.com",
  projectId: "toktoktalk-a52ce",
  storageBucket: "toktoktalk-a52ce.firebasestorage.app",
  messagingSenderId: "571285872062",
  appId: "1:571285872062:web:915073e30a95c55bb0edef",
  measurementId: "G-FBV8VHG11M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
if (location.hostname === "localhost") {
  // connectAuthEmulator(auth, "http://127.0.0.1:9099");
}

export { firebaseConfig, auth, db };
