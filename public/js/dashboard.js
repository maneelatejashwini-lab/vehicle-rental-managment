document.addEventListener("DOMContentLoaded", () => {
  async function loadDashboard() {
    try {
      const d = await api("/api/dashboard");
      document.getElementById("totalVehicles").textContent = d.total ?? 0;
      document.getElementById("availableVehicles").textContent = d.available ?? 0;
      document.getElementById("unavailableVehicles").textContent = d.unavailable ?? 0;
      document.getElementById("totalBookings").textContent = d.totalRentals ?? 0;
      document.getElementById("ongoingBookings").textContent = `Ongoing: ${d.ongoing ?? 0}`;
      const tbody = document.getElementById("recentTable");
      tbody.innerHTML = d.recent.length ? d.recent.map(r => `<tr>
        <td>#${r.rental_id}</td><td>${escapeHtml(r.customer_name)}</td><td>${escapeHtml(r.vehicle_model)}</td>
        <td>${escapeHtml(r.start_date)}</td><td>${escapeHtml(r.end_date)}</td><td><strong>${money(r.total_amount)}</strong></td>
        <td><span class="pill ${String(r.rental_status).toLowerCase()}">${escapeHtml(r.rental_status)}</span></td></tr>`).join("") : `<tr><td colspan="7">No bookings yet.</td></tr>`;
    } catch (e) { document.getElementById("recentTable").innerHTML = `<tr><td colspan="7">${escapeHtml(e.message)}. Check database connection.</td></tr>`; }
  }
  document.getElementById("refreshDashboard").addEventListener("click", loadDashboard);
  loadDashboard();
});
