import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD1PPDhogcw7fBu27PkO1iuMfGFLUwMN70",
  authDomain: "fir-55206.firebaseapp.com",
  databaseURL: "https://fir-55206-default-rtdb.firebaseio.com",
  projectId: "fir-55206",
  storageBucket: "fir-55206.firebasestorage.app",
  messagingSenderId: "24586463698",
  appId: "1:24586463698:web:8b2f21073295ef4382400b",
  measurementId: "G-K676BWHYR4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
