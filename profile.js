import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const profileInfo = document.getElementById("profileInfo");
const favoritesList = document.getElementById("favoritesList");

const becomeAgentBtn = document.getElementById("becomeAgentBtn");
const agentApplication = document.getElementById("agentApplication");

let currentUserId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  currentUserId = user.uid;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.data();

  profileInfo.innerHTML = `
    <p><strong>Name:</strong> ${data.name || data.businessName}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Role:</strong> ${data.role}</p>
  `;

  const favIds = data.favorites || [];

  const snapshot = await getDocs(collection(db, "properties"));

  let favProperties = [];

  snapshot.forEach(docItem => {
    if (favIds.includes(docItem.id)) {
      favProperties.push({
        id: docItem.id,
        ...docItem.data()
      });
    }
  });

  favoritesList.innerHTML = favProperties.length
    ? favProperties.map(p => `
        <div class="card">
          <img src="${p.image}">
          <p>${p.title}</p>
          <h4>₦${p.price.toLocaleString()}</h4>
        </div>
      `).join("")
    : "<p>No favorites yet</p>";
});

/* ✏️ EDIT PROFILE */
window.toggleEdit = () => {
  document.getElementById("editSection").style.display = "block";
};

window.saveChanges = async () => {
  const newName = document.getElementById("editName").value;

  if (!newName) return alert("Enter a name");

  await updateDoc(doc(db, "users", currentUserId), {
    name: newName
  });

  alert("Updated successfully");
  location.reload();
};
if (becomeAgentBtn) {
  becomeAgentBtn.onclick = () => {
    agentApplication.style.display =
      agentApplication.style.display === "block"
        ? "none"
        : "block";
  };
}
window.submitAgentApplication = async () => {
  const businessName = document.getElementById("businessName").value;
  const phone = document.getElementById("phoneNumber").value;
  const cac = document.getElementById("cacNumber").value;

  if (!businessName || !phone) {
    alert("Please complete required fields");
    return;
  }

  await updateDoc(doc(db, "users", currentUserId), {
    businessName,
    phone,
    cac,
    role: "pending-agent",
    agentApplicationDate: Date.now()
  });

  alert("Application submitted successfully!");

  location.reload();
};