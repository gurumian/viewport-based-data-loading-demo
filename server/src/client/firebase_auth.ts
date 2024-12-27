import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig, auth } from "./firebase_config";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';


const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    console.log(auth);
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Signed in user:", user);
    // Handle successful sign-in (e.g., update UI, store user info)
  }
  catch (error) {
    console.error("Error during sign-in:", error);
    // Handle errors (e.g., show error message to user)
  }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
    // Handle successful sign-out (e.g., update UI, clear user data)
  }
  catch (error) {
    console.error("Error signing out:", error);
    // Handle sign-out error
  }
};

export { signInWithGoogle, signOutUser, auth };