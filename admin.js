import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================================================
   ELEMENTS
========================================================= */

const pendingProperties = document.getElementById("pendingProperties");

const pendingList = document.getElementById("pendingList");

const totalUsers = document.getElementById("totalUsers");

const totalAgents = document.getElementById("totalAgents");

const pendingAgents = document.getElementById("pendingAgents");

const heroCount = document.getElementById("heroCount");

const featuredCount = document.getElementById("featuredCount");

const luxuryCount = document.getElementById("luxuryCount");

const soldCount = document.getElementById("soldCount");

const propertyForm = document.getElementById("propertyForm");

const adminProperties = document.getElementById("adminProperties");

const propertySearch = document.getElementById("propertySearch");

const propertyStatusFilter = document.getElementById("propertyStatusFilter");

const propertyTotal = document.getElementById("propertyTotal");

let allProperties = [];

let editingPropertyId = null;

let editingGallery = [];

let editingMainImage = "";

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const mobileMenuToggle = document.getElementById("mobileMenuToggle");

const adminSidebar = document.getElementById("adminSidebar");

const sidebarOverlay = document.getElementById("sidebarOverlay");

function toggleSidebar() {
  adminSidebar?.classList.toggle("active");

  sidebarOverlay?.classList.toggle("active");
}

mobileMenuToggle?.addEventListener("click", toggleSidebar);

sidebarOverlay?.addEventListener("click", toggleSidebar);

document.querySelectorAll(".sidebar-link").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 800) {
      adminSidebar?.classList.remove("active");
      sidebarOverlay?.classList.remove("active");
    }
  });
});

/* =========================================================
   HOMEPAGE PLACEMENT HELPER
========================================================= */

function getHomepagePlacements(property) {
  if (Array.isArray(property.homepagePlacements)) {
    return property.homepagePlacements;
  }

  /*
    Compatibility with old properties
    that still use homepagePlacement.
  */

  if (property.homepagePlacement && property.homepagePlacement !== "none") {
    return [property.homepagePlacement];
  }

  return [];
}

/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {
  if (status === "sold") {
    return "Sold";
  }

  if (status === "rented") {
    return "Rented";
  }

  return "Available";
}

/* =========================================================
   PLACEMENT LABEL
========================================================= */

function getPlacementLabels(property) {
  const placements = getHomepagePlacements(property);

  if (!placements.length) {
    return "No Homepage Placement";
  }

  return placements
    .map((placement) => {
      if (placement === "hero") {
        return "Diamond Hero";
      }

      if (placement === "featured") {
        return "Featured";
      }

      if (placement === "luxury") {
        return "Luxury";
      }

      if (placement === "sold-showcase") {
        return "Sold Showcase";
      }

      return placement;
    })
    .join(" • ");
}

/* =========================================================
   ADMIN AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";

    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("User data not found");

      return;
    }

    const data = userDoc.data();

    if (data.role !== "admin") {
      alert("Access denied");

      window.location.href = "index.html";

      return;
    }

    await loadDashboard();

    await loadPendingProperties();

    await loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error loading admin panel");
  }
});

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {
  try {
    const snapshot = await getDocs(collection(db, "users"));

    const users = [];

    snapshot.forEach((docItem) => {
      users.push({
        id: docItem.id,
        ...docItem.data(),
      });
    });

    totalUsers.innerText = users.length;

    totalAgents.innerText = users.filter(
      (user) => user.role === "agent"
    ).length;

    pendingAgents.innerText = users.filter(
      (user) => user.role === "pending-agent"
    ).length;

    renderPending(users);
  } catch (error) {
    console.error(error);

    alert("Error loading dashboard");
  }
}

/* =========================================================
   PENDING AGENTS
========================================================= */

function renderPending(users) {
  const pending = users.filter((user) => user.role === "pending-agent");

  pendingList.innerHTML = "";

  if (!pending.length) {
    pendingList.innerHTML = `
      <div class="empty-admin-state">
        <span>✓</span>
        <strong>No pending applications</strong>
        <p>All agent applications have been reviewed.</p>
      </div>
    `;

    return;
  }

  pending.forEach((user) => {
    const card = document.createElement("div");

    card.className = "admin-user-card";

    card.innerHTML = `

      <h3>
        ${user.businessName || "No Business Name"}
      </h3>

      <p>
        <strong>Name:</strong>
        ${user.name || "-"}
      </p>

      <p>
        <strong>Email:</strong>
        ${user.email || "-"}
      </p>

      <p>
        <strong>Phone:</strong>
        ${user.phone || "-"}
      </p>

      <p>
        <strong>CAC:</strong>
        ${user.cac || "-"}
      </p>

      <button
        class="approve-btn"
        onclick="approveAgent('${user.id}')"
      >
        Approve
      </button>

      <button
        class="reject-btn"
        onclick="rejectAgent('${user.id}')"
      >
        Reject
      </button>

    `;

    pendingList.appendChild(card);
  });
}

/* =========================================================
   APPROVE AGENT
========================================================= */

window.approveAgent = async (id) => {
  try {
    await updateDoc(doc(db, "users", id), {
      role: "agent",
      verificationStatus: "approved",
    });

    alert("Agent approved");

    await loadDashboard();
  } catch (error) {
    console.error(error);

    alert("Error approving agent");
  }
};

/* =========================================================
   REJECT AGENT
========================================================= */

window.rejectAgent = async (id) => {
  try {
    await updateDoc(doc(db, "users", id), {
      role: "buyer",
      verificationStatus: "rejected",
    });

    alert("Application rejected");

    await loadDashboard();
  } catch (error) {
    console.error(error);

    alert("Error rejecting application");
  }
};

/* =========================================================
   ADD PROPERTY
========================================================= */

propertyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const mainFile = document.getElementById("mainImage").files[0];

    let mainImage = "";

    if (mainFile) {
      mainImage = await convertToBase64(mainFile);
    }

    const galleryFiles = document.getElementById("galleryImages").files;

    const gallery = [];

    for (const file of galleryFiles) {
      gallery.push(await convertToBase64(file));
    }

    /* =========================
         GET MULTIPLE PLACEMENTS
      ========================== */

    const homepagePlacements = Array.from(
      document.querySelectorAll('input[name="homepagePlacement"]:checked')
    ).map((input) => input.value);

    const property = {
      title: document.getElementById("title").value.trim(),

      price: Number(document.getElementById("price").value),

      location: document.getElementById("location").value.trim(),

      address: document.getElementById("address").value.trim(),

      type: document.getElementById("type").value,

      image: mainImage,

      gallery,

      shortDescription: document
        .getElementById("shortDescription")
        .value.trim(),

      fullDescription: document.getElementById("fullDescription").value.trim(),

      /*
          Canonical homepage system
        */

      homepagePlacements,

      /*
          Legacy compatibility
        */

      featured: homepagePlacements.includes("featured"),

      verified: true,

      promotionPackage: "none",

      promotionExpiry: null,

      promotionPricePaid: 0,

      status: document.getElementById("status").value,

      approvalStatus: "approved",

      createdAt: Date.now(),
    };

    await addDoc(collection(db, "properties"), property);

    alert("Property added successfully");

    propertyForm.reset();

    await loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error adding property");
  }
});

/* =========================================================
   BASE64
========================================================= */

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = (error) => reject(error);
  });
}

/* =========================================================
   LOAD PROPERTIES
========================================================= */

async function loadProperties() {
  try {
    const snapshot = await getDocs(collection(db, "properties"));

    allProperties = [];

    snapshot.forEach((docItem) => {
      allProperties.push({
        id: docItem.id,

        ...docItem.data(),
      });
    });

    renderProperties(getFilteredProperties());

    updatePromotionStats();
  } catch (error) {
    console.error(error);
  }
}

/* =========================================================
   FILTER
========================================================= */

function getFilteredProperties() {
  const search = propertySearch?.value.trim().toLowerCase() || "";

  const status = propertyStatusFilter?.value || "all";

  return allProperties.filter((property) => {
    const searchableText = `

        ${property.title || ""}

        ${property.location || ""}

        ${property.type || ""}

      `.toLowerCase();

    const matchesSearch = searchableText.includes(search);

    const matchesStatus =
      status === "all" || (property.status || "available") === status;

    return matchesSearch && matchesStatus;
  });
}

/* =========================================================
   SEARCH EVENTS
========================================================= */

propertySearch?.addEventListener("input", () => {
  renderProperties(getFilteredProperties());
});

propertyStatusFilter?.addEventListener("change", () => {
  renderProperties(getFilteredProperties());
});

/* =========================================================
   PROMOTION COUNTS
========================================================= */

function updatePromotionStats() {
  const heroProperties = allProperties.filter((property) =>
    getHomepagePlacements(property).includes("hero")
  );

  const featuredProperties = allProperties.filter((property) =>
    getHomepagePlacements(property).includes("featured")
  );

  const luxuryProperties = allProperties.filter((property) =>
    getHomepagePlacements(property).includes("luxury")
  );

  const soldProperties = allProperties.filter((property) => {
    const placements = getHomepagePlacements(property);

    return (
      placements.includes("sold-showcase") &&
      (property.status === "sold" || property.status === "rented")
    );
  });

  heroCount.innerText = heroProperties.length;

  featuredCount.innerText = featuredProperties.length;

  luxuryCount.innerText = luxuryProperties.length;

  if (soldCount) {
    soldCount.innerText = soldProperties.length;
  }

  if (propertyTotal) {
    propertyTotal.innerText = allProperties.length;
  }
}

/* =========================================================
   RENDER PROPERTIES
========================================================= */

function renderProperties(properties) {
  adminProperties.innerHTML = "";

  if (!properties.length) {
    adminProperties.innerHTML = `

      <div class="empty-admin-state">

        <span>⌕</span>

        <strong>
          No properties found
        </strong>

        <p>
          Try changing your search or filter.
        </p>

      </div>

    `;

    return;
  }

  properties.forEach((property) => {
    const card = document.createElement("div");

    card.className = "admin-property-card";

    const placements = getHomepagePlacements(property);

    const status = property.status || "available";

    const statusLabel = getStatusLabel(status);

    const statusClass =
      status === "sold" ? "sold" : status === "rented" ? "rented" : "";

    const featured = property.featured || placements.includes("featured");

    card.innerHTML = `

      <img
        src="${property.image || ""}"
        alt="${property.title || "Property"}"
      >


      <div class="admin-property-content">

        <h3>
          ${property.title || "Untitled Property"}
        </h3>


        <p>
          ₦${Number(property.price || 0).toLocaleString()}
        </p>


        <p>
          ${property.location || "Nigeria"}
        </p>


        <div class="property-status-line">

          <span
            class="status-dot ${statusClass}"
          ></span>

          <span>
            ${statusLabel}
          </span>

        </div>


        <span class="promotion-badge">

          ${getPlacementLabels(property)}

        </span>


        <div class="admin-property-actions">

          <button
            class="edit-btn"
            onclick="editProperty('${property.id}')"
          >
            Edit
          </button>


          <button
            class="feature-btn"
            onclick="toggleFeatured(
              '${property.id}',
              ${featured}
            )"
          >
            ${featured ? "Remove Featured" : "Feature"}
          </button>


          <button
            class="delete-btn"
            onclick="deleteProperty('${property.id}')"
          >
            Delete
          </button>

        </div>

      </div>

    `;

    adminProperties.appendChild(card);
  });
}

/* =========================================================
   DELETE
========================================================= */

window.deleteProperty = async (id) => {
  if (!confirm("Delete this property permanently?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "properties", id));

    alert("Property deleted");

    await loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error deleting property");
  }
};

/* =========================================================
   FEATURE TOGGLE
========================================================= */

window.toggleFeatured = async (id, currentStatus) => {
  try {
    const property = allProperties.find((item) => item.id === id);

    if (!property) return;

    let placements = getHomepagePlacements(property);

    if (currentStatus) {
      placements = placements.filter((item) => item !== "featured");
    } else {
      if (!placements.includes("featured")) {
        placements.push("featured");
      }
    }

    await updateDoc(doc(db, "properties", id), {
      homepagePlacements: placements,

      featured: placements.includes("featured"),
    });

    await loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error updating featured status");
  }
};

/* =========================================================
   EDIT PROPERTY
========================================================= */

window.editProperty = async (id) => {
  try {
    const propertyDoc = await getDoc(doc(db, "properties", id));

    if (!propertyDoc.exists()) {
      alert("Property not found");

      return;
    }

    const property = propertyDoc.data();

    editingPropertyId = id;

    editingGallery = property.gallery || [];

    editingMainImage = property.image || "";

    const placements = getHomepagePlacements(property);

    document.getElementById("editTitle").value = property.title || "";

    document.getElementById("editPrice").value = property.price || "";

    document.getElementById("editLocation").value = property.location || "";

    document.getElementById("editDescription").value =
      property.fullDescription || "";

    document.getElementById("editStatus").value =
      property.status || "available";

    /* PLACEMENTS */

    document.getElementById("editPlacementHero").checked =
      placements.includes("hero");

    document.getElementById("editPlacementFeatured").checked =
      placements.includes("featured");

    document.getElementById("editPlacementLuxury").checked =
      placements.includes("luxury");

    document.getElementById("editPlacementSold").checked =
      placements.includes("sold-showcase");

    /* IMAGES */

    document.getElementById("editMainPreview").src = editingMainImage;

    renderGalleryPreview();

    document.getElementById("editModal").style.display = "flex";
  } catch (error) {
    console.error(error);

    alert("Error loading property");
  }
};

/* =========================================================
   CLOSE MODAL
========================================================= */

window.closeEditModal = () => {
  document.getElementById("editModal").style.display = "none";
};

/* =========================================================
   SAVE EDITED PROPERTY
========================================================= */

window.savePropertyChanges = async () => {
  if (!editingPropertyId) {
    return;
  }

  try {
    const placements = [];

    if (document.getElementById("editPlacementHero").checked) {
      placements.push("hero");
    }

    if (document.getElementById("editPlacementFeatured").checked) {
      placements.push("featured");
    }

    if (document.getElementById("editPlacementLuxury").checked) {
      placements.push("luxury");
    }

    if (document.getElementById("editPlacementSold").checked) {
      placements.push("sold-showcase");
    }

    const status = document.getElementById("editStatus").value;

    await updateDoc(doc(db, "properties", editingPropertyId), {
      title: document.getElementById("editTitle").value.trim(),

      price: Number(document.getElementById("editPrice").value),

      location: document.getElementById("editLocation").value.trim(),

      fullDescription: document.getElementById("editDescription").value.trim(),

      status,

      homepagePlacements: placements,

      featured: placements.includes("featured"),

      image: editingMainImage,

      gallery: editingGallery,
    });

    alert("Property updated successfully");

    closeEditModal();

    await loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error updating property");
  }
};

/* =========================================================
   MAIN IMAGE
========================================================= */

document
  .getElementById("editMainImage")
  ?.addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    editingMainImage = await convertToBase64(file);

    document.getElementById("editMainPreview").src = editingMainImage;
  });

/* =========================================================
   GALLERY
========================================================= */

document
  .getElementById("editGalleryImages")
  ?.addEventListener("change", async (event) => {
    const files = event.target.files;

    for (const file of files) {
      editingGallery.push(await convertToBase64(file));
    }

    renderGalleryPreview();
  });

function renderGalleryPreview() {
  const container = document.getElementById("editGalleryPreview");

  if (!container) return;

  container.innerHTML = "";

  editingGallery.forEach((image, index) => {
    container.innerHTML += `

        <div class="gallery-item">

          <img
            src="${image}"
            alt="Gallery image"
          >

          <button
            type="button"
            class="remove-gallery"
            onclick="removeGalleryImage(${index})"
          >
            ×
          </button>

        </div>

      `;
  });
}

window.removeGalleryImage = (index) => {
  editingGallery.splice(index, 1);

  renderGalleryPreview();
};

/* =========================================================
   PENDING PROPERTIES
========================================================= */

async function loadPendingProperties() {
  try {
    const snapshot = await getDocs(collection(db, "properties"));

    const properties = [];

    snapshot.forEach((docItem) => {
      properties.push({
        id: docItem.id,

        ...docItem.data(),
      });
    });

    const pending = properties.filter(
      (property) => property.approvalStatus === "pending"
    );

    renderPendingProperties(pending);
  } catch (error) {
    console.error(error);
  }
}

/* =========================================================
   RENDER PENDING PROPERTIES
========================================================= */

function renderPendingProperties(properties) {
  pendingProperties.innerHTML = "";

  if (!properties.length) {
    pendingProperties.innerHTML = `

      <div class="empty-admin-state">

        <span>✓</span>

        <strong>
          No pending properties
        </strong>

        <p>
          The property approval queue is clear.
        </p>

      </div>

    `;

    return;
  }

  properties.forEach((property) => {
    pendingProperties.innerHTML += `

        <div class="admin-property-card">

          <img
            src="${property.image || ""}"
            alt="${property.title || "Property"}"
          >


          <div class="admin-property-content">

            <h3>
              ${property.title || "Untitled Property"}
            </h3>

            <p>
              ₦${Number(property.price || 0).toLocaleString()}
            </p>

            <p>
              ${property.location || "Nigeria"}
            </p>

            <p>
              Agent:
              ${property.agentName || "-"}
            </p>


            <div class="admin-property-actions">

              <button
                class="approve-btn"
                onclick="approveProperty('${property.id}')"
              >
                Approve
              </button>


              <button
                class="reject-btn"
                onclick="rejectProperty('${property.id}')"
              >
                Reject
              </button>

            </div>

          </div>

        </div>

      `;
  });
}

/* =========================================================
   APPROVE PROPERTY
========================================================= */

window.approveProperty = async (id) => {
  try {
    await updateDoc(doc(db, "properties", id), {
      approvalStatus: "approved",

      verified: true,
    });

    alert("Property approved");

    await loadPendingProperties();

    await loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error approving property");
  }
};

/* =========================================================
   REJECT PROPERTY
========================================================= */

window.rejectProperty = async (id) => {
  if (!confirm("Reject and delete this property?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, "properties", id));

    alert("Property rejected");

    await loadPendingProperties();

    await loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error rejecting property");
  }
};
