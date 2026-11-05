document.addEventListener("DOMContentLoaded", () => {
  const vehicleSelect = document.getElementById("bookingVehicle");
  const form = document.getElementById("bookingForm");
  const message = document.getElementById("bookingMessage");
  let availableVehicles = [];

  async function loadVehicles() {
    try {
      availableVehicles = await api("/api/vehicles?status=Available");
      vehicleSelect.innerHTML = `<option value="">Choose an available vehicle ▾</option>` + availableVehicles.map(v =>
        `<option value="${v.vehicle_id}">${escapeHtml(v.vehicle_model)} · ${escapeHtml(v.vehicle_number)} · ${money(v.rent_per_day)}/day</option>`
      ).join("");
      updateEstimate();
    } catch (e) { setMessage(message, e.message, "error"); }
  }

  function updateEstimate() {
    const v = availableVehicles.find(x => x.vehicle_id === Number(vehicleSelect.value));
    const start = document.getElementById("start_date").value;
    const end = document.getElementById("end_date").value;
    let days = 0;
    if (start && end && end >= start) days = Math.floor((new Date(end + "T00:00:00") - new Date(start + "T00:00:00")) / 86400000) + 1;
    document.getElementById("estimateVehicle").textContent = v ? `${v.vehicle_model} (${v.vehicle_number})` : "Not selected";
    document.getElementById("estimateRate").textContent = money(v?.rent_per_day || 0);
    document.getElementById("estimateDays").textContent = days;
    document.getElementById("estimateTotal").textContent = money(days * Number(v?.rent_per_day || 0));
    const endInput = document.getElementById("end_date");
    endInput.min = start || "";
  }

  async function loadRentals() {
    const tbody = document.getElementById("rentalsTable");
    try {
      const rentals = await api("/api/rentals");
      if (!rentals.length) { tbody.innerHTML = `<tr><td colspan="7">No bookings yet.</td></tr>`; return; }
      tbody.innerHTML = rentals.map(r => `<tr>
        <td>#${r.rental_id}</td><td>${escapeHtml(r.customer_name)}<br><span class="muted">${escapeHtml(r.phone)}</span></td>
        <td>${escapeHtml(r.vehicle_model)}<br><span class="muted">${escapeHtml(r.vehicle_number)}</span></td>
        <td>${escapeHtml(r.start_date)}</td><td>${escapeHtml(r.end_date)}</td><td><strong>${money(r.total_amount)}</strong></td>
        <td><span class="pill ${String(r.rental_status).toLowerCase()}">${escapeHtml(r.rental_status)}</span></td>
        <td><select data-rental-status="${r.rental_id}" aria-label="Update booking status">
          ${["Booked","Active","Completed","Cancelled"].map(s => `<option ${s===r.rental_status?"selected":""}>${s}</option>`).join("")}
        </select></td></tr>`).join("");
    } catch (e) { tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(e.message)}</td></tr>`; }
  }

  [vehicleSelect, document.getElementById("start_date"), document.getElementById("end_date")].forEach(el => el.addEventListener("change", updateEstimate));
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const body = {
      vehicle_id: vehicleSelect.value,
      customer_name: document.getElementById("customer_name").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      license_number: document.getElementById("license_number").value,
      start_date: document.getElementById("start_date").value,
      end_date: document.getElementById("end_date").value
    };
    try {
      const result = await api("/api/rentals", { method: "POST", body: JSON.stringify(body) });
      setMessage(message, `${result.message} Booking #${result.rental_id}; ${result.days} day(s), total ${money(result.total_amount)}.`, "success");
      form.reset(); updateEstimate(); await loadVehicles(); await loadRentals();
    } catch (err) { setMessage(message, err.message, "error"); }
  });

  document.getElementById("rentalsTable").addEventListener("change", async e => {
    const select = e.target.closest("[data-rental-status]");
    if (!select) return;
    try {
      await api(`/api/rentals/${select.dataset.rentalStatus}/status`, { method: "PATCH", body: JSON.stringify({ rental_status: select.value }) });
      await loadRentals();
    } catch (err) { alert(err.message); await loadRentals(); }
  });
  document.getElementById("refreshBookings").addEventListener("click", loadRentals);
  loadVehicles(); loadRentals();
});
