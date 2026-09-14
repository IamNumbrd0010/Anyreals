import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const grid = document.getElementById("propertyGrid");
const pagination = document.getElementById("pagination");

let properties = [];
let favorites = [];
let currentUser = null;

let viewed = JSON.parse(localStorage.getItem("viewed")) || [];

let currentPage = 1;
const perPage = 9;

/* 🔐 AUTH STATE */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    favorites = userDoc.data().favorites || [];
  } else {
    favorites = [];
    currentUser = null;
  }

  renderProperties();
});

/* 📦 FETCH PROPERTIES */
async function fetchProperties() {
  try {
    const querySnapshot = await getDocs(collection(db, "properties"));

    properties = querySnapshot.docs
  .map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  .filter(
    property =>
      property.approvalStatus === "approved"
  );

    renderProperties();

  } catch (error) {
    console.error("Error fetching properties:", error);
  }
}

/* 🔍 FILTER */
function getFilteredProperties() {
  let search = document.getElementById("searchInput").value.toLowerCase();
  let location = document.getElementById("locationFilter").value;
  let type = document.getElementById("typeFilter").value;
  let price = document.getElementById("priceFilter").value;
  let sort = document.getElementById("sortFilter").value;
  let verified = document.getElementById("verifiedOnly").checked;

  let filtered = properties.filter(p => {
    return (
      (!location || p.location === location) &&
      (!type || p.type === type) &&
      (!verified || p.verified) &&
      (p.title.toLowerCase().includes(search))
    );
  });

  if (price === "low") filtered = filtered.filter(p => p.price < 5000000);
  if (price === "mid") filtered = filtered.filter(p => p.price >= 5000000 && p.price <= 20000000);
  if (price === "high") filtered = filtered.filter(p => p.price > 20000000);

  if (sort === "newest") filtered.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === "low-high") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high-low") filtered.sort((a, b) => b.price - a.price);

  return filtered;
}

/* 🧱 RENDER */
function renderProperties() {
  if (!grid) return;

  let list = getFilteredProperties();

  let start = (currentPage - 1) * perPage;
  let paginated = list.slice(start, start + perPage);

  grid.innerHTML = "";

  paginated.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.image}">
      <div class="card-content">
        <span class="badge">${p.status || ""}</span>
        <h3>₦${p.price?.toLocaleString()}</h3>
        <p>${p.title}</p>
        <small>${p.location}</small>

        <div class="card-actions">

  <button onclick="viewProperty('${p.id}')">
    View
  </button>

  <button onclick="toggleFavorite('${p.id}')">
    ${favorites.includes(p.id) ? "❤️" : "🤍"}
  </button>

</div>

<p
  class="agent-link"
  onclick="
    event.stopPropagation();
    openAgentPage('${p.agentEmail}')
  "
>
  ${p.agentName || "Agent"}
</p>
        
        
      </div>
      
    `;

    grid.appendChild(card);
  });

  renderPagination(list.length);
}

/* 📄 PAGINATION */
function renderPagination(total) {
  pagination.innerHTML = "";
  let pages = Math.ceil(total / perPage);

  for (let i = 1; i <= pages; i++) {
    let btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPage) btn.classList.add("active");

    btn.onclick = () => {
      currentPage = i;
      renderProperties();
    };

    pagination.appendChild(btn);
  }
}

/* 👁 VIEW PROPERTY */
function viewProperty(id) {
  let prop = properties.find(p => p.id === id);

  viewed = viewed.filter(v => v !== id);
  viewed.unshift(id);
  localStorage.setItem("viewed", JSON.stringify(viewed));

  localStorage.setItem("selectedProperty", JSON.stringify(prop));
  window.location.href = "property.html";
}

/* ❤️ FAVORITE */
async function toggleFavorite(id) {
  if (!currentUser) {
    alert("Please login first");
    return;
  }

  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    favorites
  });

  renderProperties();
}

/* 🎯 EVENTS */
document.querySelectorAll(".filters input, .filters select")
  .forEach(el => el.addEventListener("change", () => {
    currentPage = 1;
    renderProperties();
  }));

fetchProperties();

window.viewProperty = viewProperty;
window.toggleFavorite = toggleFavorite;

window.openAgentPage =
  (email) => {

    localStorage.setItem(
      "selectedAgent",
      email
    );

    window.location.href =
      "agent.html";
};