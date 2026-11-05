
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("vehicleGrid");
  const formSection = document.getElementById("vehicleFormSection");
  const form = document.getElementById("vehicleForm");
  const message = document.getElementById("vehicleMessage");
  const search = document.getElementById("vehicleSearch");
  const typeFilter = document.getElementById("typeFilter");
  const statusFilter = document.getElementById("statusFilter");

  let allVehicles = [];
  let searchTimer;

  // Load vehicles from the server
  async function loadVehicles() {
    try {
      grid.innerHTML = `
        <div class="empty-state">Loading vehicles...</div>
      `;

      allVehicles = await api("/api/vehicles");

      const params = new URLSearchParams();

      if (search.value.trim()) {
        params.set("search", search.value.trim());
      }

      if (typeFilter.value) {
        params.set("type", typeFilter.value);
      }

      if (statusFilter.value) {
        params.set("status", statusFilter.value);
      }

      const query = params.toString();
      const url = query
        ? `/api/vehicles?${query}`
        : "/api/vehicles";

      const filteredVehicles = await api(url);

      renderVehicles(filteredVehicles);

      const suggestions = document.getElementById("vehicleSuggestions");

      if (suggestions) {
        suggestions.innerHTML = allVehicles.map(v => `
          <option value="${escapeHtml(v.vehicle_number)}">
            ${escapeHtml(v.vehicle_model)}
          </option>
        `).join("");
      }
    } catch (error) {
      console.error("Could not load vehicles:", error);

      grid.innerHTML = `
        <div class="empty-state">
          <strong>Could not load vehicles</strong>
          <p>${escapeHtml(error.message || "Unknown error")}</p>
          <p>Check the server, API route, and database connection.</p>
        </div>
      `;
    }
  }

  // Select the image for each vehicle
  function getVehicleImage(vehicle) {
    const model =
      `${vehicle.vehicle_model || ""} ${vehicle.vehicle_type || ""}`
        .toLowerCase();

    if (model.includes("swift") || model.includes("dzire")) {
      return "/images/swift-dzire.jpg";
    }

    if (model.includes("creta")) {
      return "/images/creta.jpg";
    }

    if (model.includes("classic") || model.includes("royal enfield")) {
      return "/images/classic350.jpg";
    }

    if (model.includes("innova")) {
      return "/images/innova.jpg";
    }

    if (model.includes("activa")) {
      return "/images/activa.jpg";
    }

    if (model.includes("seltos")) {
      return "/images/seltos.jpg";
    }

    return "/images/vehicles-banner.jpg";
  }

  // Display vehicle cards
  function renderVehicles(vehicles) {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <strong>No vehicles found</strong>
          Add a vehicle or adjust your search filters.
        </div>
      `;
      return;
    }

    grid.innerHTML = vehicles.map(v => `
      <article class="vehicle-card">
        
    

        <div class="vehicle-card-body">
          <div class="vehicle-card-top">
            <h3>${escapeHtml(v.vehicle_model)}</h3>

            <span class="pill ${
              v.status === "Available" ? "available" : "unavailable"
            }">
              ${escapeHtml(v.status)}
            </span>
          </div>

          <p class="vehicle-number">
            ${escapeHtml(v.vehicle_number)} ·
            ${escapeHtml(v.vehicle_type)} ·
            ID ${v.vehicle_id}
          </p>

          <div class="vehicle-card-bottom">
            <div class="price">
              ${money(v.rent_per_day)}
              <small>/ day</small>
            </div>
            <span class="muted">Daily rate</span>
          </div>

          <div class="card-actions">
            <button
              class="btn btn-light btn-small"
              data-edit="${v.vehicle_id}"
              type="button"
            >
              Edit
            </button>

            <button
              class="btn btn-danger btn-small"
              data-delete="${v.vehicle_id}"
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    `).join("");
  }

  // Open the add/edit vehicle form
  function openForm(vehicle = null) {
    formSection.hidden = false;

    document.getElementById("vehicleFormTitle").textContent =
      vehicle ? "Edit vehicle" : "Add a vehicle";

    document.getElementById("vehicle_id").value =
      vehicle?.vehicle_id || "";

    document.getElementById("vehicle_number").value =
      vehicle?.vehicle_number || "";

    document.getElementById("vehicle_type").value =
      vehicle?.vehicle_type || "";

    document.getElementById("vehicle_model").value =
      vehicle?.vehicle_model || "";

    document.getElementById("rent_per_day").value =
      vehicle?.rent_per_day ?? "";

    document.getElementById("status").value =
      vehicle?.status || "Available";

    formSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // Add a new vehicle
  document.getElementById("newVehicleBtn").addEventListener("click", () => {
    form.reset();
    document.getElementById("vehicle_id").value = "";
    openForm();
  });

  // Cancel the vehicle form
  document.getElementById("cancelVehicleBtn").addEventListener("click", () => {
    formSection.hidden = true;
  });

  // Clear search and filters
  document.getElementById("clearFilters").addEventListener("click", () => {
    search.value = "";
    typeFilter.value = "";
    statusFilter.value = "";
    loadVehicles();
  });

  // Search and filter vehicles
  [search, typeFilter, statusFilter].forEach(element => {
    element.addEventListener(
      element === search ? "input" : "change",
      () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadVehicles, 250);
      }
    );
  });

  // Edit and delete vehicle actions
  grid.addEventListener("click", async event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
      const id = Number(editButton.dataset.edit);

      const vehicle = allVehicles.find(
        item => Number(item.vehicle_id) === id
      );

      if (vehicle) {
        openForm(vehicle);
      }
    }

    if (deleteButton) {
      const id = Number(deleteButton.dataset.delete);

      if (!confirm("Delete this vehicle? This cannot be undone.")) {
        return;
      }

      try {
        await api(`/api/vehicles/${id}`, {
          method: "DELETE"
        });

        setMessage(message, "Vehicle deleted successfully.", "success");

        await loadVehicles();
      }  catch (error) {
  console.error("Delete vehicle error:", error);

  alert("Delete failed: " + error.message);

  setMessage(
    message,
    error.message || "Unable to delete vehicle.",
    "error"
  );
}
    }
  });

  // Add or update a vehicle
  form.addEventListener("submit", async event => {
    event.preventDefault();

    const id = document.getElementById("vehicle_id").value;

    const body = {
      vehicle_number:
        document.getElementById("vehicle_number").value.trim(),

      vehicle_type:
        document.getElementById("vehicle_type").value,

      vehicle_model:
        document.getElementById("vehicle_model").value.trim(),

      rent_per_day:
        document.getElementById("rent_per_day").value,

      status:
        document.getElementById("status").value
    };

    try {
      await api(
        id ? `/api/vehicles/${id}` : "/api/vehicles",
        {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(body)
        }
      );

      setMessage(
        message,
        id ? "Vehicle updated successfully." : "Vehicle added successfully.",
        "success"
      );

      form.reset();
      document.getElementById("vehicle_id").value = "";
      formSection.hidden = true;

      await loadVehicles();
    } catch (error) {
      console.error("Save vehicle error:", error);
      setMessage(message, error.message, "error");
    }
  });

  // Initial load
  loadVehicles();
});
