import { db } from "./firebase.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// NAV MENU TOGGLE
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("navMenu");

toggle.onclick = () => {
  nav.style.display = nav.style.display === "flex" ? "none" : "flex";
};

// SEARCH FUNCTION
function handleSearch() {
  const location = document.getElementById("searchLocation").value;
  const type = document.getElementById("searchType").value;
  const price = document.getElementById("searchPrice").value;

  const params = new URLSearchParams({
    location,
    type,
    price,
  });

  window.location.href = "properties.html?" + params.toString();
}

function goToProperties() {
  window.location.href = "properties.html";
}
// RECENTLY VIEWED
function loadRecentlyViewed() {
  const recentSection = document.getElementById("recentSection");
  const recentGrid = document.getElementById("recentGrid");

  let viewed = JSON.parse(localStorage.getItem("viewed")) || [];

  if (viewed.length === 0) return;

  // load properties
  fetchProperties().then((props) => {
    let recentItems = viewed
      .map((id) => props.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6);

    recentGrid.innerHTML = "";

    recentItems.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
          <img src="${p.image}">
          <div class="card-content">
            <h4>₦${p.price.toLocaleString()}</h4>
            <p>${p.title}</p>
          </div>
        `;

      card.onclick = () => {
        localStorage.setItem("selectedProperty", JSON.stringify(p));
        window.location.href = "property.html";
      };

      recentGrid.appendChild(card);
    });

    recentSection.style.display = "block";
  });
}
function fetchProperties() {
  return new Promise((resolve) => {
    resolve(properties);
  });
}
loadRecentlyViewed();

async function loadHomepageSections() {
  const snapshot = await getDocs(collection(db, "properties"));

  let properties = [];

  snapshot.forEach((doc) => {
    properties.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  renderFeatured(properties);

  renderNewest(properties);

  renderLuxury(properties);

  renderSold(properties);
}

function createPropertyCard(property) {
  return `

    <div
      class="card"
      onclick="
        localStorage.setItem(
          'selectedProperty',
          JSON.stringify(
            ${JSON.stringify(property)}
          )
        );

        window.location.href=
        'property.html';
      "
    >

      <img src="${property.image}">

      <div class="card-content">

        <h3>
          ₦${property.price.toLocaleString()}
        </h3>

        <p>
          ${property.title}
        </p>

        <span>
          ${property.location}
        </span>

      </div>

    </div>

  `;
}
function renderFeatured(properties) {
  const grid = document.getElementById("featuredGrid");

  const featured = properties.filter((p) => p.homepagePlacement === "featured");

  grid.innerHTML = featured.slice(0, 6).map(createPropertyCard).join("");
}
function renderLuxury(properties) {
  const grid = document.getElementById("luxuryGrid");

  const luxury = properties.filter((p) => p.homepagePlacement === "luxury");

  grid.innerHTML = luxury.slice(0, 6).map(createPropertyCard).join("");
}
function renderNewest(properties) {
  const grid = document.getElementById("newestGrid");

  const newest = [...properties]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  grid.innerHTML = newest.map(createPropertyCard).join("");
}
function renderSold(properties) {
  const grid = document.getElementById("soldGrid");

  const sold = properties.filter(
    (p) => p.status === "sold" || p.status === "rented"
  );

  grid.innerHTML = sold.slice(0, 6).map(createPropertyCard).join("");
}
loadHomepageSections();
