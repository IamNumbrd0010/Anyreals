import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const toggle = document.getElementById("signupToggle");

let isSignup = false;

toggle.addEventListener("click", () => {
  isSignup = !isSignup;
  toggle.textContent = isSignup ? "Login instead" : "Sign up";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    if (isSignup) {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        role: "buyer",
        status: "approved",
        createdAt: Date.now()
      });

      window.location.href = "index.html";

    } else {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
      const data = userDoc.data();

      if (!data) {
        alert("User record not found");
        return;
      }

      window.location.href = "index.html";
    }

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});