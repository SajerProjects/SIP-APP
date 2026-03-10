import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAtgSgm7W0kBgeF2-oXI4u8ElNxDPfDKCk",
  authDomain: "sip-app-9ffcc.firebaseapp.com",
  databaseURL: "https://sip-app-9ffcc-default-rtdb.firebaseio.com",
  projectId: "sip-app-9ffcc",
  storageBucket: "sip-app-9ffcc.firebasestorage.app",
  messagingSenderId: "677767910179",
  appId: "1:677767910179:web:57f336956d5995f151b296",
  measurementId: "G-B8G8PXG9GG",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, set };
