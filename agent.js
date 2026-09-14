import { auth, db }
from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  addDoc,
serverTimestamp,
  where
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    onAuthStateChanged
  }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ELEMENTS */

onAuthStateChanged(auth, (user) => {

    currentUser = user;
  
  });

const reviewsContainer =
  document.getElementById(
    "reviewsContainer"
  );

const agentWhatsapp =
  document.getElementById(
    "agentWhatsapp"
  );

const agentInstagram =
  document.getElementById(
    "agentInstagram"
  );

const agentFacebook =
  document.getElementById(
    "agentFacebook"
  );

const agentTotalListings =
  document.getElementById(
    "agentTotalListings"
  );

const agentSoldListings =
  document.getElementById(
    "agentSoldListings"
  );

const agentRentedListings =
  document.getElementById(
    "agentRentedListings"
  );

const agentAvatar =
  document.getElementById("agentAvatar");

const agentName =
  document.getElementById("agentName");

const agentEmail =
  document.getElementById("agentEmail");

const agentPhone =
  document.getElementById("agentPhone");

const agentBio =
  document.getElementById("agentBio");

const agentListings =
  document.getElementById("agentListings");

const agentViews =
  document.getElementById("agentViews");

const agentFavorites =
  document.getElementById("agentFavorites");

const agentProperties =
  document.getElementById("agentProperties");

  let currentUser = null;

/* GET AGENT */

const agentEmailParam =
  localStorage.getItem("selectedAgent");

loadAgent();


async function loadAgent() {

  try {

    /* USER QUERY */

    const userQuery =
      query(
        collection(db, "users"),
        where(
          "email",
          "==",
          agentEmailParam
        )
      );

    const userSnapshot =
      await getDocs(userQuery);

    if (userSnapshot.empty) {

      alert("Agent not found");

      return;
    }

    const agent =
      userSnapshot.docs[0].data();

    /* PROFILE */

    agentName.innerText =
      agent.businessName || "Agent";

    agentEmail.innerText =
      agent.email || "";

    agentPhone.innerText =
      agent.phone || "";

      agentBio.innerText =
      agent.bio ||
      "This agent hasn't added a bio yet.";
    
    agentWhatsapp.href =
      `https://wa.me/${agent.whatsapp || ""}`;
    
    agentInstagram.href =
      agent.instagram || "#";
    
    agentFacebook.href =
      agent.facebook || "#";

    agentAvatar.innerText =
      (
        agent.businessName || "A"
      )[0].toUpperCase();

    /* PROPERTIES */

    const propertiesQuery =
      query(
        collection(db, "properties"),
        where(
          "agentEmail",
          "==",
          agent.email
        )
      );

    const propertySnapshot =
      await getDocs(propertiesQuery);

    let properties = [];

    propertySnapshot.forEach(doc => {

      properties.push({
        id: doc.id,
        ...doc.data()
      });

    });

    /* STATS */

    agentTotalListings.innerText =
  properties.length;

agentSoldListings.innerText =
  properties.filter(
    p => p.status === "sold"
  ).length;

agentRentedListings.innerText =
  properties.filter(
    p => p.status === "rented"
  ).length;

    agentListings.innerText =
      properties.length;

    agentViews.innerText =
      properties.reduce(
        (acc, p) =>
          acc + (p.views || 0),
        0
      );

    agentFavorites.innerText =
      properties.reduce(
        (acc, p) =>
          acc + (
            p.favoritesCount || 0
          ),
        0
      );

    renderProperties(properties);
    loadReviews();

  } catch (error) {

    console.error(error);

  }
}

/* RENDER */

function renderProperties(
  properties
) {

  agentProperties.innerHTML = "";

  if (!properties.length) {

    agentProperties.innerHTML =
      "<p>No properties yet</p>";

    return;
  }

  properties.forEach(property => {

    agentProperties.innerHTML += `

      <div
        class="property-card"
        onclick="viewProperty('${property.id}')"
      >

        <img src="${property.image}">

        <div class="property-content">

          <h3>
            ₦${property.price.toLocaleString()}
          </h3>

          <p>${property.title}</p>

          <small>
            ${property.location}
          </small>

        </div>

      </div>

    `;
  });
}

/* VIEW PROPERTY */

window.viewProperty = (id) => {

  const property =
    JSON.parse(
      localStorage.getItem("allProperties")
    )?.find(
      p => p.id === id
    );

  if (!property) return;

  localStorage.setItem(
    "selectedProperty",
    JSON.stringify(property)
  );

  window.location.href =
    "property.html";
};

async function loadReviews() {

  const snapshot =
    await getDocs(
      collection(db, "reviews")
    );

  let reviews = [];

  snapshot.forEach(doc => {

    const data = doc.data();

    if (
      data.agentEmail ===
      agentEmailParam
    ) {

      reviews.push(data);

    }
  });

  renderReviews(reviews);

}

function renderReviews(reviews) {

    reviewsContainer.innerHTML = "";
  
    if (!reviews.length) {
  
      reviewsContainer.innerHTML =
        "<p>No reviews yet</p>";
  
      return;
    }
  
    reviews.forEach(review => {
  
      reviewsContainer.innerHTML += `
  
        <div class="review-card">
  
          <h4>
            ${review.name}
          </h4>
  
          <p>
            ${"⭐".repeat(review.rating)}
          </p>
  
          <p>
            ${review.text}
          </p>
  
        </div>
  
      `;
    });
  }
  window.submitReview =
  async () => {

    

    try {
        if (!currentUser) {

        alert(
          "Please login to leave a review"
        );
      
        return;
      }

      const text =
        document.getElementById(
          "reviewText"
        ).value;

      const rating =
        Number(
          document.getElementById(
            "reviewRating"
          ).value
        );

      await addDoc(
        collection(db, "reviews"),
        {

          agentEmail:
          agentEmailParam,

          name:
          currentUser?.displayName ||
          currentUser?.email.split("@")[0] ||
            "Anonymous User",

          text,

          rating,

          createdAt:
            serverTimestamp()

        }
      );
      

      document.getElementById(
        "reviewText"
      ).value = "";

      loadReviews();

    } catch (error) {

      console.error(error);

    }
};
