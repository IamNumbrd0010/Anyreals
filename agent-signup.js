import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("agentForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userCred = await createUserWithEmailAndPassword(
    auth,
    document.getElementById("email").value,
    document.getElementById("password").value
  );

  await setDoc(doc(db, "users", userCred.user.uid), {
    name: document.getElementById("name").value,
    businessName: document.getElementById("business").value,
    phone: document.getElementById("phone").value,
    cac: document.getElementById("cac").value,
    role: "agent",
    status: "pending",
    bio: "",
whatsapp: "",
instagram: "",
facebook: "",
twitter: "",
joinedAt: Date.now(),
    createdAt: Date.now()
  });

  alert("Application submitted. Await approval.");
  window.location.href = "login.html";
});