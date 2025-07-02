
// Firebase configuration for RegulaFacil
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvgWppRYjPIP22U9-vu-J2dwrhJ2Klvpc",
  authDomain: "pmj-hmsj.firebaseapp.com",
  projectId: "pmj-hmsj",
  storageBucket: "pmj-hmsj.firebasestorage.app",
  messagingSenderId: "226296836721",
  appId: "1:226296836721:web:b2429cd730ef22b4e6e1d0",
  measurementId: "G-ZCS2BWPBE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
