import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* 🔥 FIREBASE CONFIG */

const firebaseConfig = {
  apiKey: "AIzaSyDlQSRYvij9ebYugxoCX9UXeP60qQGtH_I",
  authDomain: "anyreals-388a5.firebaseapp.com",
  projectId: "anyreals-388a5",
  storageBucket: "anyreals-388a5.firebasestorage.app",
  messagingSenderId: "266074761989",
  appId: "1:266074761989:web:bc6e713271cd3763dfa56c"
};

/* 🔥 INITIALIZE */

const app = initializeApp(firebaseConfig);

/* 🔥 SERVICES */

const db = getFirestore(app);

const storage = getStorage(app);

const auth = getAuth(app);

/* 🔥 EXPORTS */

export { db, storage, auth };