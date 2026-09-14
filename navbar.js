import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const navAuth = document.getElementById("navAuth");

onAuthStateChanged(auth, async (user) => {
  /* 🚫 NOT LOGGED IN */

  if (!user) {
    navAuth.innerHTML = `
      <a href="auth.html" class="btn">
        Login
      </a>
    `;

    return;
  }

  /* ✅ GET USER DATA */

  const userDoc = await getDoc(doc(db, "users", user.uid));

  const data = userDoc.data();

  const firstLetter = (data.name || data.businessName || "U")
    .charAt(0)
    .toUpperCase();

  /* 👤 ROLE LINKS */

  let extraLinks = "";

  if (data.role === "agent") {
    extraLinks += `
      <a href="agent-dashboard.html">
        Dashboard
      </a>
    `;
  }

  if (data.role === "admin") {
    extraLinks += `
      <a href="admin.html">
        Admin Panel
      </a>
    `;
  }

  if (data.role === "staff") {
    extraLinks += `
      <a href="staff-dashboard.html">
        Dashboard-Staff
      </a>
    `;
  }

  /* 🎨 RENDER */

  navAuth.innerHTML = `
    <div class="profile-menu">

      <div class="avatar" id="avatarBtn">
        ${firstLetter}
      </div>

      <div class="dropdown" id="dropdownMenu">

        ${extraLinks}

        <a href="profile.html">
          Profile
        </a>

        <a href="#" id="logoutBtn">
          Logout
        </a>

      </div>

    </div>
  `;

  /* DROPDOWN */

  const avatarBtn = document.getElementById("avatarBtn");

  const dropdown = document.getElementById("dropdownMenu");

  avatarBtn.onclick = () => {
    dropdown.classList.toggle("show");
  };

  /* LOGOUT */

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);

    window.location.href = "index.html";
  });
});
