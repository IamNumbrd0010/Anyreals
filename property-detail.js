const container = document.getElementById("propertyDetail");

let prop = JSON.parse(localStorage.getItem("selectedProperty"));
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

if (prop) {

  let whatsappMessage = encodeURIComponent(
    `Hello, I'm interested in the ${prop.title} listed on Anyreals.`
  );

  container.innerHTML = `
    <div class="detail-top">

      <div class="gallery">
        <img id="mainImage" src="${prop.images[0]}">
        <div class="thumbnails">
          ${prop.images.map(img => `
            <img src="${img}" onclick="changeImage('${img}')">
          `).join("")}
        </div>
      </div>

      <div class="detail-info">
        <h2>${prop.title}</h2>
        <h3>₦${prop.price.toLocaleString()}</h3>
        <p>${prop.location}</p>

        <button onclick="toggleFavorite(${prop.id})">
          ${favorites.includes(prop.id) ? "❤️ Saved" : "🤍 Save"}
        </button>

        <a href="https://wa.me/234XXXXXXXXXX?text=${whatsappMessage}" target="_blank">
          <button class="whatsapp">Chat on WhatsApp</button>
        </a>

        <button onclick="openModal()">Request Details</button>
      </div>

    </div>

    <div class="description">
      <h3>Description</h3>
      <p>${prop.description}</p>
    </div>

    <div class="similar">
      <h3>Similar Properties</h3>
      <div class="property-grid">
        ${getSimilarProperties(prop).map(p => `
          <div class="card" onclick="viewProperty(${p.id})">
            <img src="${p.image}">
            <div class="card-content">
              <h4>₦${p.price.toLocaleString()}</h4>
              <p>${p.title}</p>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

/* IMAGE SWITCH */
function changeImage(src) {
  document.getElementById("mainImage").src = src;
}

/* FAVORITE */
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  location.reload();
}

/* SIMILAR */
function getSimilarProperties(current) {
  return properties
    .filter(p => p.location === current.location && p.id !== current.id)
    .slice(0, 3);
}

/* VIEW */
function viewProperty(id) {
  let p = properties.find(x => x.id === id);
  localStorage.setItem("selectedProperty", JSON.stringify(p));
  window.location.href = "property.html";
}

/* MODAL */
function openModal() {
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}