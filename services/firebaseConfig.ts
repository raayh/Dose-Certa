import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxCktQC3akubbzcpj-4KLixB8gxy4bsFM",
  authDomain: "dose-certa-5e73f.firebaseapp.com",
  projectId: "dose-certa-5e73f",
  storageBucket: "dose-certa-5e73f.appspot.com",
  messagingSenderId: "235228979099",
  appId: "1:235228979099:web:85f7f0216f04aec52e8b3e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
