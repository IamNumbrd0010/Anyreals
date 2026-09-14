import { auth, db } from "./firebase.js";

import {
  collection,
  doc,
  updateDoc,
  increment,
  getDocs,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";



/* ELEMENTS */

const mainImage =
  document.getElementById("mainImage");

const thumbnails =
  document.getElementById("thumbnails");

const propertyTitle =
  document.getElementById("propertyTitle");

const propertyPrice =
  document.getElementById("propertyPrice");

const propertyLocation =
  document.getElementById("propertyLocation");

const propertyDescription =
  document.getElementById("propertyDescription");

const similarGrid =
  document.getElementById("similarGrid");

/* LOAD PROPERTY */

const property =
  JSON.parse(
    localStorage.getItem("selectedProperty")
  );

if (!property) {

  window.location.href = "properties.html";

}
/* INCREASE VIEWS */

try {

  await updateDoc(
    doc(db, "properties", property.id),
    {
      views: increment(1)
    }
  );

} catch (error) {

  console.error(
    "View update failed",
    error
  );

}

/* =========================
   FAVORITES SYSTEM
========================= */

const favoriteBtn =
  document.getElementById(
    "favoriteBtn"
  );

let favorites =
  JSON.parse(
    localStorage.getItem("favorites")
  ) || [];

const alreadyFavorited =
  favorites.includes(property.id);

updateFavoriteButton();

/* TOGGLE FAVORITE */

favoriteBtn.addEventListener(
  "click",
  async () => {

    try {

      if (favorites.includes(property.id)) {

        /* REMOVE */

        favorites =
          favorites.filter(
            id => id !== property.id
          );

        await updateDoc(
          doc(db, "properties", property.id),
          {
            favoritesCount:
              increment(-1)
          }
        );

      } else {

        /* ADD */

        favorites.push(property.id);

        await updateDoc(
          doc(db, "properties", property.id),
          {
            favoritesCount:
              increment(1)
          }
        );

      }

      localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
      );

      updateFavoriteButton();

    } catch (error) {

      console.error(error);

    }
  }
);

/* UPDATE BUTTON */

function updateFavoriteButton() {

  if (
    favorites.includes(property.id)
  ) {

    favoriteBtn.innerText =
      "❤️ Saved";

  } else {

    favoriteBtn.innerText =
      "♡ Save Property";

  }
}
/* MAIN INFO */

mainImage.src = property.image;

propertyTitle.innerText =
  property.title;

propertyPrice.innerText =
  `₦${property.price.toLocaleString()}`;

propertyLocation.innerText =
  property.location;

propertyDescription.innerText =
  property.fullDescription;

/* GALLERY */

thumbnails.innerHTML = "";

if (property.gallery?.length) {

  console.log(property.gallery);

  property.gallery.forEach(img => {

    const thumb =
      document.createElement("img");

    thumb.src = img;

    thumb.onclick = () => {

      mainImage.src = img;

    };

    thumbnails.appendChild(thumb);

  });

}

/* LOAD SIMILAR PROPERTIES */

loadSimilar();

async function loadSimilar() {

  const snapshot =
    await getDocs(collection(db, "properties"));

  let properties = [];

  snapshot.forEach(doc => {

    properties.push({
      id: doc.id,
      ...doc.data()
    });

  });
// contact
  const similar =
    properties.filter(p =>
      p.type === property.type &&
      p.id !== property.id
    ).slice(0, 3);

  similarGrid.innerHTML = "";

  similar.forEach(p => {

    similarGrid.innerHTML += `

      <div class="card">

        <img src="${p.image}">

        <div class="card-content">

          <h3>
            ₦${p.price.toLocaleString()}
          </h3>

          <p>${p.title}</p>

          <small>${p.location}</small>

        </div>
        <div class="card-actions">
  <button onclick="viewProperty('${p.id}')">View</button>
  <button onclick="toggleFavorite('${p.id}')">
    ${favorites.includes(p.id) ? "❤️" : "🤍"}
  </button>
</div>

      </div>

    `;
  });
}

const callBtn =
  document.getElementById(
    "callAgentBtn"
  );

const whatsappBtn =
  document.getElementById(
    "whatsappAgentBtn"
  );

/* CALL */

callBtn.onclick = () => {

  window.location.href =
    `tel:${property.agentPhone}`;

};

/* WHATSAPP */

whatsappBtn.href =
  `https://wa.me/${property.agentWhatsapp}`;

  