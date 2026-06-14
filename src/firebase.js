import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCalJpAv8V9zLVZuAgavzAPcfGGKvMspyA",
  authDomain: "polla-mundial-a7490.firebaseapp.com",
  projectId: "polla-mundial-a7490",
  storageBucket: "polla-mundial-a7490.firebasestorage.app",
  messagingSenderId: "763521620578",
  appId: "1:763521620578:web:4f60a18df76a71d68fcf3b",
  measurementId: "G-Z4D3JT8VRB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);