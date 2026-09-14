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

/* 🔥 ELEMENTS */

const pendingProperties = document.getElementById("pendingProperties");

const pendingList = document.getElementById("pendingList");

const totalUsers = document.getElementById("totalUsers");

const totalAgents = document.getElementById("totalAgents");

const pendingAgents = document.getElementById("pendingAgents");

const propertyForm = document.getElementById("propertyForm");

const heroCount = document.getElementById("heroCount");

const featuredCount = document.getElementById("featuredCount");

const luxuryCount = document.getElementById("luxuryCount");

/* 🔐 PROTECT ADMIN PAGE */

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

    /* 🚫 BLOCK NON ADMINS */

    if (data.role !== "admin") {
      alert("Access denied");

      window.location.href = "index.html";

      return;
    }

    loadDashboard();

    loadPendingProperties();
  } catch (error) {
    console.error(error);

    alert("Error loading admin panel");
  }
});

/* 📊 LOAD DASHBOARD */

async function loadDashboard() {
  try {
    const snapshot = await getDocs(collection(db, "users"));

    let users = [];

    snapshot.forEach((docItem) => {
      users.push({
        id: docItem.id,
        ...docItem.data(),
      });
    });

    totalUsers.innerText = users.length;

    totalAgents.innerText = users.filter((u) => u.role === "agent").length;

    pendingAgents.innerText = users.filter(
      (u) => u.role === "pending-agent"
    ).length;

    renderPending(users);
  } catch (error) {
    console.error(error);

    alert("Error loading dashboard");
  }
}

/* 🧑‍⚖️ PENDING AGENTS */

function renderPending(users) {
  const pending = users.filter((u) => u.role === "pending-agent");

  pendingList.innerHTML = "";

  if (!pending.length) {
    pendingList.innerHTML = "<p>No pending applications</p>";

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
        ${user.name}
      </p>

      <p>
        <strong>Email:</strong>
        ${user.email}
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

/* ✅ APPROVE AGENT */

window.approveAgent = async (id) => {
  try {
    await updateDoc(doc(db, "users", id), {
      role: "agent",
      verificationStatus: "approved",
    });

    alert("Agent approved");

    location.reload();
  } catch (error) {
    console.error(error);

    alert("Error approving agent");
  }
};

/* ❌ REJECT AGENT */

window.rejectAgent = async (id) => {
  try {
    await updateDoc(doc(db, "users", id), {
      role: "buyer",
      verificationStatus: "rejected",
    });

    alert("Application rejected");

    location.reload();
  } catch (error) {
    console.error(error);

    alert("Error rejecting application");
  }
};

/* 🏠 ADD PROPERTY */

propertyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    /* MAIN IMAGE */
    const mainFile = document.getElementById("mainImage").files[0];

    let mainImage = "";

    if (mainFile) {
      mainImage = await convertToBase64(mainFile);
    }

    /* GALLERY IMAGES */
    const galleryFiles = document.getElementById("galleryImages").files;

    let gallery = [];

    for (let file of galleryFiles) {
      const base64 = await convertToBase64(file);

      gallery.push(base64);
    }

    /* PROPERTY OBJECT */

    const property = {
      title: document.getElementById("title").value,

      price: Number(document.getElementById("price").value),

      location: document.getElementById("location").value,

      address: document.getElementById("address").value,

      type: document.getElementById("type").value,

      image: mainImage,

      gallery: gallery,

      shortDescription: document.getElementById("shortDescription").value,

      fullDescription: document.getElementById("fullDescription").value,

      featured: document.getElementById("featured").checked,

      verified: true,

      featured: false,

      homepagePlacement: "none",

      promotionPackage: "none",

      promotionExpiry: null,

      promotionPricePaid: 0,

      status: "available",

      approvalStatus: "approved",

      createdAt: Date.now(),
    };

    await addDoc(collection(db, "properties"), property);

    alert("Property added successfully");

    propertyForm.reset();
  } catch (error) {
    console.error(error);

    alert("Error adding property");
  }
});

/* 🔥 CONVERT IMAGE TO BASE64 */

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = (error) => reject(error);
  });
}

/* =========================
   LOAD ADMIN PROPERTIES
========================= */

const adminProperties = document.getElementById("adminProperties");

const propertySearch = document.getElementById("propertySearch");

let allProperties = [];

async function loadProperties() {
  const snapshot = await getDocs(collection(db, "properties"));

  allProperties = [];

  snapshot.forEach((docItem) => {
    allProperties.push({
      id: docItem.id,
      ...docItem.data(),
    });
  });

  renderProperties(allProperties);

  heroCount.innerText = allProperties.filter(
    (p) => p.homepagePlacement === "hero"
  ).length;

  featuredCount.innerText = allProperties.filter(
    (p) => p.homepagePlacement === "featured"
  ).length;

  luxuryCount.innerText = allProperties.filter(
    (p) => p.homepagePlacement === "luxury"
  ).length;
}

/* =========================
   RENDER PROPERTIES
========================= */

function renderProperties(properties) {
  adminProperties.innerHTML = "";

  if (!properties.length) {
    adminProperties.innerHTML = "<p>No properties found</p>";

    return;
  }

  properties.forEach((property) => {
    const card = document.createElement("div");

    card.className = "admin-property-card";

    card.innerHTML = `

      <img src="${property.image}">

      <div class="admin-property-content">

        <h3>${property.title}</h3>

        <p>
          ₦${property.price.toLocaleString()}
        </p>

        <p>${property.location}</p>

        <p>
          ${property.featured ? "⭐ Featured" : "Regular"}
        </p>

        <p class="promotion-badge">
  Homepage:
  ${property.homepagePlacement || "none"}
</p>

        <div class="admin-property-actions">
        
        <button
    class="edit-btn"
    onclick="editProperty('${property.id}')"
  >
    Edit
  </button>
  <select
  onchange="
    updateHomepagePlacement(
      '${property.id}',
      this.value
    )
  "
>

  <option
    value="none"
    ${property.homepagePlacement === "none" ? "selected" : ""}
  >
    No Placement
  </option>

  <option
    value="hero"
    ${property.homepagePlacement === "hero" ? "selected" : ""}
  >
   Diamond Hero Banner
  </option>

  <option
    value="featured"
    ${property.homepagePlacement === "featured" ? "selected" : ""}
  >
    Featured Section
  </option>

  <option
    value="luxury"
    ${property.homepagePlacement === "luxury" ? "selected" : ""}
  >
    Luxury Collection
  </option>

  <option
    value="newest"
    ${property.homepagePlacement === "newest" ? "selected" : ""}
  >
    Newest Listings
  </option>

  <option
    value="sold-showcase"
    ${property.homepagePlacement === "sold-showcase" ? "selected" : ""}
  >
    Sold Showcase
  </option>

</select>
        
        <button
            class="feature-btn"
            onclick="toggleFeatured('${property.id}', ${property.featured})"
          >
            ${property.featured ? "Unfeature" : "Feature"}
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

/* =========================
   DELETE PROPERTY
========================= */

window.deleteProperty = async (id) => {
  const confirmDelete = confirm("Delete this property?");

  if (!confirmDelete) return;

  await deleteDoc(doc(db, "properties", id));

  alert("Property deleted");

  loadProperties();
};

/* =========================
   FEATURE TOGGLE
========================= */

window.toggleFeatured = async (id, currentStatus) => {
  await updateDoc(doc(db, "properties", id), {
    featured: !currentStatus,
  });

  loadProperties();
};

/* =========================
   APPROVE PROPERTY
========================= */

window.approveProperty = async (id) => {
  try {
    await updateDoc(doc(db, "properties", id), {
      approvalStatus: "approved",

      verified: true,
    });

    alert("Property approved");

    loadPendingProperties();

    loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error approving property");
  }
};

/* =========================
   REJECT PROPERTY
========================= */

window.rejectProperty = async (id) => {
  const confirmReject = confirm("Reject property?");

  if (!confirmReject) return;

  try {
    await deleteDoc(doc(db, "properties", id));

    alert("Property rejected");

    loadPendingProperties();

    loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error rejecting property");
  }
};

/* =========================
   SEARCH
========================= */

propertySearch.addEventListener("input", () => {
  const value = propertySearch.value.toLowerCase();

  const filtered = allProperties.filter((property) =>
    property.title.toLowerCase().includes(value)
  );

  renderProperties(filtered);
});

/* INITIAL LOAD */

loadProperties();

/* =========================  
   EDIT PROPERTY SYSTEM
========================= */

let editingPropertyId = null;
let editingGallery = [];
let editingMainImage = "";

/* OPEN EDIT MODAL */

window.editProperty = async (id) => {
  try {
    const propertyDoc = await getDoc(doc(db, "properties", id));

    const property = propertyDoc.data();

    editingPropertyId = id;

    editingGallery = property.gallery || [];

    editingMainImage = property.image || "";

    document.getElementById("editTitle").value = property.title || "";

    document.getElementById("editPrice").value = property.price || "";

    document.getElementById("editLocation").value = property.location || "";

    document.getElementById("editDescription").value =
      property.fullDescription || "";

    document.getElementById("editFeatured").checked =
      property.featured || false;

    /* MAIN IMAGE */

    document.getElementById("editMainPreview").src = editingMainImage;

    /* GALLERY */

    renderGalleryPreview();

    document.getElementById("editModal").style.display = "flex";
  } catch (error) {
    console.error(error);

    alert("Error loading property");
  }
};

/* CLOSE MODAL */

window.closeEditModal = () => {
  document.getElementById("editModal").style.display = "none";
};

/* SAVE CHANGES */
window.savePropertyChanges = async () => {
  if (!editingPropertyId) return;

  try {
    await updateDoc(doc(db, "properties", editingPropertyId), {
      title: document.getElementById("editTitle").value,

      price: Number(document.getElementById("editPrice").value),

      location: document.getElementById("editLocation").value,

      fullDescription: document.getElementById("editDescription").value,

      featured: document.getElementById("editFeatured").checked,

      image: editingMainImage,

      gallery: editingGallery,
    });

    alert("Property updated");

    closeEditModal();

    loadProperties();
  } catch (error) {
    console.error(error);

    alert("Error updating property");
  }
};

function renderGalleryPreview() {
  const container = document.getElementById("editGalleryPreview");

  container.innerHTML = "";

  editingGallery.forEach((img, index) => {
    container.innerHTML += `

      <div class="gallery-item">

        <img src="${img}">

        <button
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

/* MAIN IMAGE CHANGE */

document
  .getElementById("editMainImage")
  .addEventListener("change", async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    editingMainImage = await convertToBase64(file);

    document.getElementById("editMainPreview").src = editingMainImage;
  });

/* GALLERY ADD */

document
  .getElementById("editGalleryImages")
  .addEventListener("change", async (e) => {
    const files = e.target.files;

    for (let file of files) {
      const base64 = await convertToBase64(file);

      editingGallery.push(base64);
    }

    renderGalleryPreview();
  });

/* =========================
   LOAD PENDING PROPERTIES
========================= */

async function loadPendingProperties() {
  const snapshot = await getDocs(collection(db, "properties"));

  let properties = [];

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
}

/* =========================
   RENDER PENDING
========================= */

function renderPendingProperties(properties) {
  pendingProperties.innerHTML = "";

  if (!properties.length) {
    pendingProperties.innerHTML = "<p>No pending properties</p>";

    return;
  }

  properties.forEach((property) => {
    pendingProperties.innerHTML += `

      <div class="admin-property-card">

        <img src="${property.image}">

        <div class="admin-property-content">

          <h3>
            ${property.title}
          </h3>

          <p>
            ₦${property.price.toLocaleString()}
          </p>

          <p>
            ${property.location}
          </p>

          <p>
            Agent:
            ${property.agentName}
          </p>

          <div
            class="admin-property-actions"
          >

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

window.updateHomepagePlacement = async (id, placement) => {
  try {
    await updateDoc(doc(db, "properties", id), {
      homepagePlacement: placement,
    });

    alert("Homepage placement updated");
  } catch (error) {
    console.error(error);
  }
};
