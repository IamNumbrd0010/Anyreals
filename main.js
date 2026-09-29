import { db } from "./firebase.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================================================
   NAV MENU
========================================================= */

const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("navMenu");

if (toggle && nav) {
  toggle.onclick = () => {
    nav.classList.toggle("active");
  };
}

/* =========================================================
   SEARCH
========================================================= */

window.handleSearch = function () {
  const location =
    document.getElementById("searchLocation")?.value.trim() || "";

  const type = document.getElementById("searchType")?.value || "";

  const price = document.getElementById("searchPrice")?.value || "";

  const params = new URLSearchParams({
    location,
    type,
    price,
  });

  window.location.href = "properties.html?" + params.toString();
};

/* =========================================================
   BROWSE PROPERTIES
========================================================= */

window.goToProperties = function () {
  window.location.href = "properties.html";
};

/* =========================================================
   GLOBAL DATA
========================================================= */

let homepageProperties = [];
let homepageAgents = [];

/* =========================================================
   FEATURED ROTATION
========================================================= */

let featuredProperties = [];
let featuredStartIndex = 0;
let featuredInterval = null;

/* =========================================================
   HERO ROTATION
========================================================= */

let heroProperties = [];
let heroIndex = 0;
let heroInterval = null;

/* =========================================================
   FETCH PROPERTIES
========================================================= */

async function fetchProperties() {
  try {
    const snapshot = await getDocs(collection(db, "properties"));

    homepageProperties = [];

    snapshot.forEach((docSnap) => {
      homepageProperties.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    console.log("Anyreals properties loaded:", homepageProperties);

    return homepageProperties;
  } catch (error) {
    console.error("Error loading properties:", error);

    return [];
  }
}

/* =========================================================
   FETCH AGENTS
========================================================= */

async function fetchAgents() {
  try {
    const snapshot = await getDocs(collection(db, "users"));

    homepageAgents = [];

    snapshot.forEach((docSnap) => {
      const user = {
        id: docSnap.id,
        ...docSnap.data(),
      };

      if (user.role === "agent" && user.verificationStatus === "approved") {
        homepageAgents.push(user);
      }
    });

    return homepageAgents;
  } catch (error) {
    console.error("Error loading agents:", error);

    return [];
  }
}

/* =========================================================
   HOMEPAGE PLACEMENT HELPER
========================================================= */

/*
   New format:

   homepagePlacements: [
      "hero",
      "featured",
      "luxury",
      "sold-showcase"
   ]

   Older format:

   homepagePlacement: "featured"

   This helper supports BOTH formats so existing
   properties do not suddenly disappear.
*/

function getHomepagePlacements(property) {
  if (Array.isArray(property.homepagePlacements)) {
    return property.homepagePlacements;
  }

  if (property.homepagePlacement && property.homepagePlacement !== "none") {
    return [property.homepagePlacement];
  }

  return [];
}

function hasPlacement(property, placement) {
  return getHomepagePlacements(property).includes(placement);
}

/* =========================================================
   PROPERTY APPROVAL HELPER
========================================================= */

function isApproved(property) {
  return property.approvalStatus === "approved";
}

/* =========================================================
   PROPERTY STATUS HELPERS
========================================================= */

function isClosedProperty(property) {
  return property.status === "sold" || property.status === "rented";
}

/* =========================================================
   PROPERTY CARD
========================================================= */

function createPropertyCard(property) {
  const card = document.createElement("article");

  card.className = "card homepage-property-card";

  /* -------------------------------------------------------
     STATUS BADGE
  ------------------------------------------------------- */

  const statusBadge =
    property.status === "sold"
      ? `
        <span class="property-badge sold-badge">
          Sold
        </span>
      `
      : property.status === "rented"
      ? `
        <span class="property-badge rented-badge">
          Rented
        </span>
      `
      : "";

  /* -------------------------------------------------------
     FEATURED BADGE
  ------------------------------------------------------- */

  const featuredBadge =
    property.featured || hasPlacement(property, "featured")
      ? `
        <span class="property-badge featured-badge">
          Featured
        </span>
      `
      : "";

  /* -------------------------------------------------------
     VERIFIED BADGE
  ------------------------------------------------------- */

  const verifiedBadge = property.verified
    ? `
        <span class="property-badge verified-badge">
          ✓ Verified
        </span>
      `
    : "";

  /* -------------------------------------------------------
     CARD HTML
  ------------------------------------------------------- */

  card.innerHTML = `

    <div class="property-image-wrapper">

      <img
        src="${property.image || ""}"
        alt="${property.title || "Anyreals property"}"
        loading="lazy"
      >

      <div class="property-badges">

        ${featuredBadge}

        ${verifiedBadge}

        ${statusBadge}

      </div>

      <div class="property-view-overlay">

        <span>
          View Property
        </span>

      </div>

    </div>


    <div class="card-content">

      <div class="property-card-top">

        <span class="property-type">
          ${property.type || "Property"}
        </span>

      </div>


      <h3>
        ₦${Number(property.price || 0).toLocaleString()}
      </h3>


      <h4>
        ${property.title || "Property"}
      </h4>


      <p class="property-location">

        <span>⌖</span>

        ${property.location || "Nigeria"}

      </p>

    </div>

  `;

  /* -------------------------------------------------------
     CLICK PROPERTY
  ------------------------------------------------------- */

  card.addEventListener("click", () => {
    localStorage.setItem("selectedProperty", JSON.stringify(property));

    window.location.href = "property.html";
  });

  return card;
}

/* =========================================================
   GRID RENDERER
========================================================= */

function renderGrid(elementId, properties) {
  const grid = document.getElementById(elementId);

  if (!grid) return;

  grid.innerHTML = "";

  if (!properties.length) {
    grid.innerHTML = `

      <div class="empty-homepage-section">

        <div class="empty-icon">
          ⌂
        </div>

        <h3>
          Coming Soon
        </h3>

        <p>
          New properties are being added
          to this collection.
        </p>

      </div>

    `;

    return;
  }

  properties.forEach((property) => {
    grid.appendChild(createPropertyCard(property));
  });
}

/* =========================================================
   FEATURED COLLECTION
========================================================= */

function getFeaturedProperties(properties) {
  return properties.filter(
    (property) =>
      hasPlacement(property, "featured") &&
      isApproved(property) &&
      !isClosedProperty(property)
  );
}

function renderFeatured(properties) {
  featuredProperties = getFeaturedProperties(properties);

  const grid = document.getElementById("featuredGrid");

  if (!grid) return;

  /* Reset rotation */

  featuredStartIndex = 0;

  /* Clear previous interval */

  if (featuredInterval) {
    clearInterval(featuredInterval);

    featuredInterval = null;
  }

  if (!featuredProperties.length) {
    renderGrid("featuredGrid", []);

    return;
  }

  renderFeaturedBatch();

  /*
     Rotate through the collection
     when there are more than 6.
  */

  if (featuredProperties.length > 6) {
    featuredInterval = setInterval(() => {
      featuredStartIndex = (featuredStartIndex + 6) % featuredProperties.length;

      renderFeaturedBatch();
    }, 5000);
  }
}

/* =========================================================
   FEATURED BATCH
========================================================= */

function renderFeaturedBatch() {
  const grid = document.getElementById("featuredGrid");

  if (!grid || !featuredProperties.length) {
    return;
  }

  grid.classList.add("featured-changing");

  setTimeout(() => {
    grid.innerHTML = "";

    const visibleProperties = [];

    for (let i = 0; i < 6; i++) {
      const index = (featuredStartIndex + i) % featuredProperties.length;

      visibleProperties.push(featuredProperties[index]);
    }

    /*
       Remove duplicates when there
       are fewer than 6 properties.
    */

    const uniqueProperties = [
      ...new Map(visibleProperties.map((item) => [item.id, item])).values(),
    ];

    uniqueProperties.forEach((property) => {
      grid.appendChild(createPropertyCard(property));
    });

    grid.classList.remove("featured-changing");
  }, 150);
}

/* =========================================================
   NEWEST LISTINGS
========================================================= */

function renderNewest(properties) {
  const newest = properties

    .filter((property) => isApproved(property) && !isClosedProperty(property))

    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))

    .slice(0, 6);

  renderGrid("newestGrid", newest);
}

/* =========================================================
   LUXURY COLLECTION
========================================================= */

function renderLuxury(properties) {
  const luxury = properties.filter(
    (property) =>
      hasPlacement(property, "luxury") &&
      isApproved(property) &&
      !isClosedProperty(property)
  );

  renderGrid("luxuryGrid", luxury);
}

/* =========================================================
   SOLD / RENTED SHOWCASE
========================================================= */

function renderSold(properties) {
  const sold = properties.filter(
    (property) =>
      hasPlacement(property, "sold-showcase") &&
      isApproved(property) &&
      isClosedProperty(property)
  );

  renderGrid("soldGrid", sold);
}

/* =========================================================
   DIAMOND HERO
========================================================= */

function getHeroProperties(properties) {
  return properties.filter(
    (property) =>
      hasPlacement(property, "hero") &&
      isApproved(property) &&
      !isClosedProperty(property)
  );
}

/* =========================================================
   RENDER DIAMOND HERO
========================================================= */

function renderDiamondHero(properties) {
  const hero = document.getElementById("diamondHero");

  if (!hero) return;

  heroProperties = getHeroProperties(properties);

  heroIndex = 0;

  /* Clear previous rotation */

  if (heroInterval) {
    clearInterval(heroInterval);

    heroInterval = null;
  }

  /*
     No promoted hero property.
     Show the normal Anyreals hero.
  */

  if (!heroProperties.length) {
    renderDefaultHero();

    return;
  }

  /*
     Render the first hero.
  */

  renderHeroProperty(heroProperties[heroIndex]);

  /*
     Rotate if there are multiple
     Diamond Hero properties.
  */

  if (heroProperties.length > 1) {
    heroInterval = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroProperties.length;

      changeHeroProperty(heroProperties[heroIndex]);
    }, 6000);
  }
}

/* =========================================================
   DEFAULT HERO
========================================================= */

function renderDefaultHero() {
  const hero = document.getElementById("diamondHero");

  if (!hero) return;

  hero.classList.remove("has-property");

  hero.innerHTML = `

    <div class="hero-background"></div>

    <div class="hero-overlay"></div>


    <div class="hero-content">

      <span class="hero-eyebrow">

        PREMIUM PROPERTY MARKETPLACE

      </span>


      <h1>

        Discover Exceptional

        <span>
          Properties Across Nigeria
        </span>

      </h1>


      <p>

        Luxury homes, prime investments
        and trusted property professionals.

      </p>


      <div class="hero-search">

        ${getSearchMarkup()}

      </div>

    </div>

  `;

  attachSearchEvents();
}

/* =========================================================
   RENDER HERO PROPERTY
========================================================= */

function renderHeroProperty(property) {
  const hero = document.getElementById("diamondHero");

  if (!hero) return;

  hero.classList.add("has-property");

  hero.innerHTML = `

    <div
      class="hero-background"
      style="
        background-image:url('${property.image || ""}')
      "
    ></div>


    <div class="hero-overlay"></div>


    <div
      class="hero-content hero-property-content"
    >

      <span class="hero-eyebrow">

        ANYREALS DIAMOND COLLECTION

      </span>


      <h1>

        ${property.title || "Exceptional Property"}

      </h1>


      <p class="hero-property-location">

        ⌖ ${property.location || "Nigeria"}

      </p>


      <div class="hero-property-price">

        ₦${Number(property.price || 0).toLocaleString()}

      </div>


      <button
        class="hero-property-btn"
        id="heroPropertyButton"
      >

        Explore Property

      </button>


      <div
        class="hero-search hero-search-floating"
      >

        ${getSearchMarkup()}

      </div>

    </div>

  `;

  const heroButton = document.getElementById("heroPropertyButton");

  if (heroButton) {
    heroButton.addEventListener("click", () => {
      localStorage.setItem("selectedProperty", JSON.stringify(property));

      window.location.href = "property.html";
    });
  }

  attachSearchEvents();
}

/* =========================================================
   HERO TRANSITION
========================================================= */

function changeHeroProperty(property) {
  const hero = document.getElementById("diamondHero");

  if (!hero) return;

  /*
     Fade the current hero out.
  */

  hero.classList.add("hero-changing");

  setTimeout(() => {
    renderHeroProperty(property);

    /*
       Allow CSS transition
       to animate the new hero.
    */

    requestAnimationFrame(() => {
      hero.classList.remove("hero-changing");
    });
  }, 350);
}

/* =========================================================
   HERO SEARCH MARKUP
========================================================= */

function getSearchMarkup() {
  return `

    <div class="hero-search-field">

      <span>⌖</span>

      <input
        type="text"
        id="searchLocation"
        placeholder="Where are you looking?"
      >

    </div>


    <select id="searchType">

      <option value="">
        Property Type
      </option>

      <option value="Apartment">
        Apartment
      </option>

      <option value="House">
        House
      </option>

      <option value="Land">
        Land
      </option>

    </select>


    <select id="searchPrice">

      <option value="">
        Price Range
      </option>

      <option value="low">
        Below ₦5M
      </option>

      <option value="mid">
        ₦5M - ₦20M
      </option>

      <option value="high">
        Above ₦20M
      </option>

    </select>


    <button onclick="handleSearch()">

      Search Properties

    </button>

  `;
}

/* =========================================================
   HERO SEARCH EVENTS
========================================================= */

function attachSearchEvents() {
  const locationInput = document.getElementById("searchLocation");

  if (locationInput) {
    locationInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        window.handleSearch();
      }
    });
  }
}

/* =========================================================
   TRUSTED AGENTS
========================================================= */

function renderAgents(agents) {
  const grid = document.getElementById("agentGrid");

  if (!grid) return;

  grid.innerHTML = "";

  if (!agents.length) {
    grid.innerHTML = `

      <div class="empty-homepage-section">

        <h3>
          Trusted agents coming soon
        </h3>

        <p>

          Our network of verified
          property professionals
          is growing.

        </p>

      </div>

    `;

    return;
  }

  agents.slice(0, 6).forEach((agent) => {
    const card = document.createElement("div");

    card.className = "agent-card";

    const initial = (agent.businessName || agent.name || "A")
      .charAt(0)
      .toUpperCase();

    card.innerHTML = `

        <div class="agent-avatar">

          ${
            agent.photoURL
              ? `
                <img
                  src="${agent.photoURL}"
                  alt="${agent.businessName || agent.name || "Verified Agent"}"
                >
              `
              : `
                <span>
                  ${initial}
                </span>
              `
          }

        </div>


        <div class="agent-info">

          <h3>

            ${agent.businessName || agent.name || "Verified Agent"}

          </h3>


          <p>

            ${agent.location || "Nigeria"}

          </p>


          <span class="verified-agent">

            ✓ Verified Agent

          </span>

        </div>

      `;

    grid.appendChild(card);
  });
}

/* =========================================================
   STATISTICS
========================================================= */

function renderStats(properties, agents) {
  const propertyCount = document.getElementById("propertyCount");

  const agentCount = document.getElementById("agentCount");

  if (propertyCount) {
    const approvedProperties = properties.filter((property) =>
      isApproved(property)
    );

    propertyCount.textContent = approvedProperties.length.toLocaleString();
  }

  if (agentCount) {
    agentCount.textContent = agents.length.toLocaleString();
  }
}

/* =========================================================
   RECENTLY VIEWED
========================================================= */

function loadRecentlyViewed(properties) {
  const recentSection = document.getElementById("recentSection");

  const recentGrid = document.getElementById("recentGrid");

  if (!recentSection || !recentGrid) {
    return;
  }

  let viewed = [];

  try {
    viewed = JSON.parse(localStorage.getItem("viewed")) || [];
  } catch (error) {
    viewed = [];
  }

  if (!viewed.length) {
    return;
  }

  const recentItems = viewed

    .map((id) => properties.find((property) => property.id === id))

    .filter(Boolean)

    .slice(0, 6);

  if (!recentItems.length) {
    return;
  }

  recentGrid.innerHTML = "";

  recentItems.forEach((property) => {
    recentGrid.appendChild(createPropertyCard(property));
  });

  recentSection.style.display = "block";
}

/* =========================================================
   COLLECTION LINKS
========================================================= */

function setupCollectionLinks() {
  const featuredButton = document.getElementById("viewFeatured");

  if (featuredButton) {
    featuredButton.onclick = () => {
      window.location.href = "featured.html";
    };
  }

  const propertyButtons = document.querySelectorAll("[data-browse-properties]");

  propertyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = "properties.html";
    });
  });
}

/* =========================================================
   LOAD HOMEPAGE
========================================================= */

async function loadHomepage() {
  const [properties, agents] = await Promise.all([
    fetchProperties(),

    fetchAgents(),
  ]);

  if (!properties.length) {
    console.log("No properties found.");
  }

  /*
     HERO
  */

  renderDiamondHero(properties);

  /*
     FEATURED
  */

  renderFeatured(properties);

  /*
     NEWEST
  */

  renderNewest(properties);

  /*
     LUXURY
  */

  renderLuxury(properties);

  /*
     SOLD / RENTED
  */

  renderSold(properties);

  /*
     VERIFIED AGENTS
  */

  renderAgents(agents);

  /*
     STATISTICS
  */

  renderStats(properties, agents);

  /*
     RECENTLY VIEWED
  */

  loadRecentlyViewed(properties);

  /*
     COLLECTION LINKS
  */

  setupCollectionLinks();
}

/* =========================================================
   CLEANUP
========================================================= */

/*
   Stop homepage intervals when the page
   is being unloaded.
*/

window.addEventListener("beforeunload", () => {
  if (featuredInterval) {
    clearInterval(featuredInterval);
  }

  if (heroInterval) {
    clearInterval(heroInterval);
  }
});

/* =========================================================
   START
========================================================= */

loadHomepage();
