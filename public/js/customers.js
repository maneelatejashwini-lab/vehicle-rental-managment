document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("customersTable");
  const search = document.getElementById("customerSearch");
  let customers = [];
  async function loadCustomers() {
    try {
      customers = await api("/api/customers");
      document.getElementById("customerSuggestions").innerHTML = customers.map(c => `<option value="${escapeHtml(c.customer_name)}">${escapeHtml(c.phone)}</option>`).join("");
      render();
    } catch (e) { tbody.innerHTML = `<tr><td colspan="5">${escapeHtml(e.message)}</td></tr>`; }
  }
  function render() {
    const q = search.value.trim().toLowerCase();
    const list = customers.filter(c => [c.customer_name,c.phone,c.email,c.license_number,String(c.customer_id)].some(v => String(v || "").toLowerCase().includes(q)));
    tbody.innerHTML = list.length ? list.map(c => `<tr><td>${c.customer_id}</td><td><strong>${escapeHtml(c.customer_name)}</strong></td><td>${escapeHtml(c.phone)}</td><td>${escapeHtml(c.email || "—")}</td><td>${escapeHtml(c.license_number)}</td></tr>`).join("") : `<tr><td colspan="5">No matching customers found.</td></tr>`;
  }
  search.addEventListener("input", render);
  document.getElementById("refreshCustomers").addEventListener("click", loadCustomers);
  loadCustomers();
});
