import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const userBox = document.getElementById("userBox");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const data = userDoc.data();

    loginBtn.style.display = "none";

    const name = data.name || data.businessName || "User";
    const initial = name.charAt(0).toUpperCase();

    userBox.innerHTML = `
      <div class="avatar" id="avatarBtn">${initial}</div>

      <div class="dropdown" id="dropdownMenu">
        <p onclick="goProfile()">Profile</p>
        <p onclick="logout()">Logout</p>
      </div>
    `;

    const avatar = document.getElementById("avatarBtn");
    const dropdown = document.getElementById("dropdownMenu");

    avatar.onclick = () => {
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    };

    window.logout = async () => {
      await signOut(auth);
      window.location.href = "index.html";
    };

    window.goProfile = () => {
      window.location.href = "profile.html";
    };

  } else {
    loginBtn.style.display = "block";
    userBox.innerHTML = "";
  }
});