import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5nG15MmQpXIDkZ0qxlA9lOHwymgo0ljs",
  authDomain: "dpsstudio-gridx.firebaseapp.com",
  projectId: "dpsstudio-gridx",
  storageBucket: "dpsstudio-gridx.firebasestorage.app",
  messagingSenderId: "833878450744",
  appId: "1:833878450744:web:d2e0659f48b99e769d3ccd",
  measurementId: "G-JNZ6HH6806"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);