import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("authForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  try {
    // Try login first
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    handleLogin(userCred.user);
  } catch {
    // If login fails → create account
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, "users", userCred.user.uid), {
      name,
      email,
      role,
      status: role === "agent" ? "pending" : "approved",
      createdAt: Date.now(),
    });

    handleLogin(userCred.user);
  }
});

async function handleLogin(user) {
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.data();

  if (data.role === "agent" && data.status !== "approved") {
    alert("Your account is under review");
    return;
  }

  if (data.role === "agent") {
    window.location.href = "dashboard.html";
  } else if (data.role === "staff") {
    window.location.href = "staff-dashboard.html";
  } else {
    window.location.href = "index.html";
  }
}
