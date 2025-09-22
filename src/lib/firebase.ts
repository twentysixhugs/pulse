
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  "projectId": "studio-2674085050-7674d",
  "appId": "1:826559198124:web:b08ad5b597771bff20c009",
  "apiKey": "AIzaSyBn7D8FSpuZZSorl8jFEfEDy1O-ixV5vb0",
  "authDomain": "studio-2674085050-7674d.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "826559198124"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
