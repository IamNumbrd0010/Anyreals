import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentAgent = null;
let currentAgentId = null;
let editingPropertyId = null;
let editingGallery = [];

let editingMainImage = "";

/* ELEMENTS */

const agentAvatar = document.getElementById("agentAvatar");

const agentBusinessName = document.getElementById("agentBusinessName");

const agentEmail = document.getElementById("agentEmail");

const totalListings = document.getElementById("totalListings");

const featuredListings = document.getElementById("featuredListings");

const totalViews = document.getElementById("totalViews");

const totalFavorites = document.getElementById("totalFavorites");

const staffCount = document.getElementById("staffCount");

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

  const userData = userSnapshot.docs[0].data();

  if (userData.role !== "agent") {
    alert("Only agents can access this dashboard");

    window.location.href = "index.html";

    return;
  }

  currentAgent = userData;
  currentAgentId = user.uid;

  loadAgent(userData, user.uid);
  loadStaff();
});

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
    where("agentEmail", "==", userData.email)
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

      agentId: currentAgentId,

      agentName: currentAgent.businessName,

      agentEmail: currentAgent.email,

      agentPhone: currentAgent.phone || "",

      agentWhatsapp: currentAgent.whatsapp || "",
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

window.saveAgentProfile = async () => {
  try {
    await updateDoc(doc(db, "users", currentAgentId), {
      phone: document.getElementById("agentPhoneInput").value,

      whatsapp: document.getElementById("agentWhatsappInput").value,

      instagram: document.getElementById("agentInstagramInput").value,

      facebook: document.getElementById("agentFacebookInput").value,

      bio: document.getElementById("agentBioInput").value,
    });

    alert("Profile updated!");
  } catch (error) {
    console.error(error);

    alert("Error updating profile");
  }
};

window.addStaff = async () => {
  try {
    const email = document.getElementById("staffEmail").value;

    if (email === currentAgent.email) {
      alert("You cannot add yourself as staff");

      return;
    }

    const role = document.getElementById("staffRole").value;

    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
      alert("User not found");

      return;
    }

    const userDoc = snapshot.docs[0];

    const staffData = userDoc.data();

    if (staffData.agencyId) {
      alert("User already belongs to an agency");

      return;
    }

    await updateDoc(doc(db, "users", userDoc.id), {
      role: "staff",

      agencyId: currentAgentId,

      staffRole: role,

      permissions: {
        upload: true,
        edit: true,
        delete: role === "manager",
        approve: role === "manager",
        manageStaff: role === "manager",
      },
    });

    alert("Staff added");

    loadStaff();
  } catch (error) {
    console.error(error);
  }
};
async function loadStaff() {
  const staffContainer = document.getElementById("staffContainer");

  const q = query(
    collection(db, "users"),
    where("agencyId", "==", currentAgentId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    staffContainer.innerHTML = "<p>No staff members yet</p>";

    staffCount.innerText = 0;

    return;
  }

  staffContainer.innerHTML = "";

  staffCount.innerText = snapshot.size;

  snapshot.forEach((docSnap) => {
    const staff = docSnap.data();

    staffContainer.innerHTML += `

        <div class="staff-card">
      
          <h3>${staff.email}</h3>
      
          <span class="staff-role">
  ${staff.staffRole}
</span>
      
          <button
            onclick="removeStaff('${docSnap.id}')"
          >
            Remove
          </button>
      
        </div>
      
      `;
  });
}
window.removeStaff = async (userId) => {
  await updateDoc(doc(db, "users", userId), {
    role: "user",
    agencyId: "",
    staffRole: "",
    permissions: {},
  });

  loadStaff();
};
