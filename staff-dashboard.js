import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentAgent = null;
let currentAgentId = null;
let editingPropertyId = null;
let editingGallery = [];
let editingMainImage = "";
let currentStaff = null;
let currentPermissions = {};
let agencyData = null;

/* ELEMENTS */

const agentAvatar = document.getElementById("agentAvatar");

const agentBusinessName = document.getElementById("agentBusinessName");

const agentEmail = document.getElementById("agentEmail");

const totalListings = document.getElementById("totalListings");

const featuredListings = document.getElementById("featuredListings");

const totalViews = document.getElementById("totalViews");

const totalFavorites = document.getElementById("totalFavorites");

const agentProperties = document.getElementById("agentProperties");

/* AUTH */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";

    return;
  }

  const userQuery = query(
    collection(db, "users"),
    where("email", "==", user.email)
  );

  const userSnapshot = await getDocs(userQuery);

  if (userSnapshot.empty) {
    alert("User not found");
    return;
  }

  const staffData = userSnapshot.docs[0].data();

  if (staffData.role !== "staff") {
    window.location.href = "dashboard.html";

    return;
  }

  currentStaff = staffData;

  currentPermissions = staffData.permissions || {};

  const agencySnap = await getDoc(doc(db, "users", staffData.agencyId));

  if (!agencySnap.exists()) {
    alert("Agency not found");

    return;
  }

  agencyData = agencySnap.data();

  loadAgencyDashboard();
});

async function loadAgencyDashboard() {
  agentBusinessName.innerText = agencyData.businessName || "Agency";

  agentEmail.innerText = agencyData.email;

  agentAvatar.innerText = (agencyData.businessName || "A")[0].toUpperCase();

  loadProperties();
}

/* LOAD AGENT */

async function loadAgent(userData, uid) {
  document.getElementById("agentPhoneInput").value = userData.phone || "";

  document.getElementById("agentWhatsappInput").value = userData.whatsapp || "";

  document.getElementById("agentInstagramInput").value =
    userData.instagram || "";

  document.getElementById("agentFacebookInput").value = userData.facebook || "";

  document.getElementById("agentBioInput").value = userData.bio || "";

  agentBusinessName.innerText = userData.businessName || "Agent";

  agentEmail.innerText = userData.email;

  agentAvatar.innerText = (userData.businessName || "A")[0].toUpperCase();

  /* LOAD PROPERTIES */

  const propertiesQuery = query(
    collection(db, "properties"),
    where("agentEmail", "==", agencyData.email)
  );

  const snapshot = await getDocs(propertiesQuery);

  let properties = [];

  snapshot.forEach((doc) => {
    properties.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  /* STATS */

  totalListings.innerText = properties.length;

  featuredListings.innerText = properties.filter((p) => p.featured).length;

  totalViews.innerText = properties.reduce((acc, p) => acc + (p.views || 0), 0);

  totalFavorites.innerText = properties.reduce(
    (acc, p) => acc + (p.favoritesCount || 0),
    0
  );

  /* RENDER */

  renderProperties(properties);
}

/* RENDER PROPERTIES */

/* RENDER PROPERTIES */

function renderProperties(properties) {
  window.properties = properties;

  agentProperties.innerHTML = "";

  if (!properties.length) {
    agentProperties.innerHTML = "<p>No properties yet</p>";

    return;
  }

  properties.forEach((property) => {
    agentProperties.innerHTML += `
  
        <div class="admin-property-card">
  
          <img src="${property.image}">
  
          <div class="admin-property-content">
  
            <div class="property-top-row">
  
              <h3>
                ${property.title}
              </h3>
  
              <span class="property-status">
                ${property.status || "available"}
              </span>
  
            </div>
  
            <p>
              ₦${property.price.toLocaleString()}
            </p>
  
            <p>
              ${property.location}
            </p>
  
            <div class="property-analytics">
  
              <span>
                👁 ${property.views || 0}
              </span>
  
              <span>
                ❤️ ${property.favoritesCount || 0}
              </span>
  
            </div>
  
            <div class="admin-property-actions">
  
              <button
                class="view-btn"
                onclick="viewProperty('${property.id}')"
              >
                View
              </button>
  
              <button
                class="edit-btn"
                onclick="editProperty('${property.id}')"
              >
                Edit
              </button>
  
              <button
                class="delete-btn"
                onclick="deleteProperty('${property.id}')"
              >
                Delete
              </button>
  
            </div>
  
            <select
              class="status-select"
              onchange="
                updatePropertyStatus(
                  '${property.id}',
                  this.value
                )
              "
            >
  
              <option value="available"
                ${property.status === "available" ? "selected" : ""}
              >
                Available
              </option>
  
              <option value="pending"
                ${property.status === "pending" ? "selected" : ""}
              >
                Pending
              </option>
  
              <option value="sold"
                ${property.status === "sold" ? "selected" : ""}
              >
                Sold
              </option>
  
              <option value="rented"
                ${property.status === "rented" ? "selected" : ""}
              >
                Rented
              </option>
  
              <option value="unavailable"
                ${property.status === "unavailable" ? "selected" : ""}
              >
                Unavailable
              </option>
  
              <option value="under-review"
                ${property.status === "under-review" ? "selected" : ""}
              >
                Under Review
              </option>
  
              <option value="reserved"
                ${property.status === "reserved" ? "selected" : ""}
              >
                Reserved
              </option>
  
            </select>
  
          </div>
  
        </div>
  
      `;
  });
}

/* VIEW PROPERTY */

window.viewProperty = (id) => {
  const property = window.properties.find((p) => p.id === id);

  if (!property) return;

  localStorage.setItem("selectedProperty", JSON.stringify(property));

  window.location.href = "property.html";
};

/* =========================
   MODAL SYSTEM
========================= */

window.openUploadModal = () => {
  document.getElementById("uploadModal").style.display = "flex";
};

window.closeUploadModal = () => {
  document.getElementById("uploadModal").style.display = "none";
};

/* =========================
     BASE64
  ========================= */

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = (error) => reject(error);
  });
}

/* =========================
     SUBMIT PROPERTY
  ========================= */

window.submitProperty = async () => {
  if (!currentPermissions.upload) {
    alert("You do not have permission to upload properties.");
    return;
  }
  try {
    /* MAIN IMAGE */

    const mainFile = document.getElementById("propertyMainImage").files[0];

    let mainImage = "";

    if (mainFile) {
      mainImage = await convertToBase64(mainFile);
    }

    /* GALLERY */

    const galleryFiles = document.getElementById("propertyGallery").files;

    let gallery = [];

    for (let file of galleryFiles) {
      const base64 = await convertToBase64(file);

      gallery.push(base64);
    }

    /* PROPERTY OBJECT */

    const property = {
      title: document.getElementById("propertyTitle").value,

      price: Number(document.getElementById("propertyPrice").value),

      location: document.getElementById("propertyLocation").value,

      address: document.getElementById("propertyAddress").value,

      type: document.getElementById("propertyType").value,

      shortDescription: document.getElementById("propertyShortDescription")
        .value,

      fullDescription: document.getElementById("propertyFullDescription").value,

      image: mainImage,

      gallery: gallery,

      featured: false,

      verified: false,

      approvalStatus: "pending",

      status: "available",

      createdAt: Date.now(),

      views: 0,

      favoritesCount: 0,

      /* AGENT INFO */

      agentId: currentStaff.agencyId,
      agentName: agencyData.businessName,
      agentEmail: agencyData.email,
      agentPhone: agencyData.phone || "",
      agentWhatsapp: agencyData.whatsapp || "",
    };

    await addDoc(collection(db, "properties"), property);

    alert("Property submitted for approval");

    closeUploadModal();

    location.reload();
  } catch (error) {
    console.error(error);

    alert("Error submitting property");
  }
};
/* DELETE PROPERTY */

window.deleteProperty = async (id) => {
  if (!currentPermissions.delete) {
    alert("You do not have permission to delete properties.");
    return;
  }
  const confirmDelete = confirm("Delete this property?");

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "properties", id));

    alert("Property deleted");

    location.reload();
  } catch (error) {
    console.error(error);

    alert("Error deleting property");
  }
};

/* =========================
   EDIT PROPERTY
========================= */

window.editProperty = async (id) => {
  if (!currentPermissions.edit) {
    alert("You do not have permission to edit properties.");
    return;
  }
  const property = window.properties.find((p) => p.id === id);

  if (!property) return;

  editingPropertyId = id;

  editingGallery = property.gallery || [];

  editingMainImage = property.image || "";

  document.getElementById("editTitle").value = property.title || "";

  document.getElementById("editPrice").value = property.price || "";

  document.getElementById("editLocation").value = property.location || "";

  document.getElementById("editDescription").value =
    property.fullDescription || "";

  /* MAIN IMAGE PREVIEW */

  document.getElementById("editMainPreview").src = editingMainImage;

  /* RENDER GALLERY */

  renderGalleryPreview();

  /* OPEN MODAL */

  document.getElementById("editModal").style.display = "flex";
};

/* =========================
     CLOSE EDIT MODAL
  ========================= */

window.closeEditModal = () => {
  document.getElementById("editModal").style.display = "none";
};

/* =========================
     SAVE CHANGES
  ========================= */

window.savePropertyChanges = async () => {
  if (!editingPropertyId) return;

  try {
    await updateDoc(doc(db, "properties", editingPropertyId), {
      title: document.getElementById("editTitle").value,

      price: Number(document.getElementById("editPrice").value),

      location: document.getElementById("editLocation").value,

      fullDescription: document.getElementById("editDescription").value,

      image: editingMainImage,

      gallery: editingGallery,
    });

    alert("Property updated");

    closeEditModal();

    location.reload();
  } catch (error) {
    console.error(error);

    alert("Error updating property");
  }
};

/* =========================
     MAIN IMAGE CHANGE
  ========================= */

document
  .getElementById("editMainImage")
  .addEventListener("change", async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    editingMainImage = await convertToBase64(file);

    document.getElementById("editMainPreview").src = editingMainImage;
  });

/* =========================
     GALLERY IMAGE ADD
  ========================= */

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
     RENDER GALLERY
  ========================= */

function renderGalleryPreview() {
  const container = document.getElementById("editGalleryPreview");

  container.innerHTML = "";

  editingGallery.forEach((img, index) => {
    container.innerHTML += `
  
          <div class="gallery-item">
  
            <img src="${img}">
  
            <button
              class="remove-gallery"
              onclick="
                removeGalleryImage(${index})
              "
            >
              ×
            </button>
  
          </div>
  
        `;
  });
}

/* =========================
     REMOVE GALLERY IMAGE
  ========================= */

window.removeGalleryImage = (index) => {
  editingGallery.splice(index, 1);

  renderGalleryPreview();
};

/* UPDATE STATUS */

window.updatePropertyStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "properties", id), {
      status: status,
    });
  } catch (error) {
    console.error(error);
  }
};

async function loadProperties() {
  const propertiesQuery = query(
    collection(db, "properties"),
    where("agentEmail", "==", agencyData.email)
  );

  const snapshot = await getDocs(propertiesQuery);

  let properties = [];

  snapshot.forEach((docSnap) => {
    properties.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  totalListings.innerText = properties.length;

  featuredListings.innerText = properties.filter((p) => p.featured).length;

  totalViews.innerText = properties.reduce((acc, p) => acc + (p.views || 0), 0);

  totalFavorites.innerText = properties.reduce(
    (acc, p) => acc + (p.favoritesCount || 0),
    0
  );

  renderProperties(properties);
}
