import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDbfcuzBCPYq1roQ-flv_aAfMsMuq4dsl4",
  authDomain: "cebolask-72070.firebaseapp.com",
  projectId: "cebolask-72070",
  storageBucket: "cebolask-72070.firebasestorage.app",
  messagingSenderId: "82519951581",
  appId: "1:82519951581:web:f165ccca4b1e33a44bf334",
  measurementId: "G-V2746S52Y3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
