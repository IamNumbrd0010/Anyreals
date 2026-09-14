import { auth, db } from "./firebase.js";

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("agentLoginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
    const data = userDoc.data();

    if (data.role !== "agent") {
      alert("This account is not an agent account");
      return;
    }

    if (data.status !== "approved") {
      alert("Your account is under review");
      return;
    }

    window.location.href = "agent-dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});
