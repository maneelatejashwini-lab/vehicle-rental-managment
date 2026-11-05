document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (menuToggle && navLinks) menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"));

  const slides = [...document.querySelectorAll(".hero-slider .slide")];
  if (slides.length) {
    const dots = [...document.querySelectorAll(".slider-dots .dot")];
    let current = 0;
    let timer;
    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
      dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => show(current + 1), 5000); };
    document.querySelector(".slider-arrow.prev")?.addEventListener("click", () => { show(current - 1); restart(); });
    document.querySelector(".slider-arrow.next")?.addEventListener("click", () => { show(current + 1); restart(); });
    dots.forEach((dot, i) => dot.addEventListener("click", () => { show(i); restart(); }));
    restart();
  }

  if (document.body.dataset.page === "home") loadHomeStats();
});

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "Something went wrong.");
  return data;
}
function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function setMessage(el, message, type = "") {
  if (!el) return;
  el.textContent = message;
  el.className = `message ${type}`.trim();
}
async function loadHomeStats() {
  try {
    const data = await api("/api/dashboard");
    document.getElementById("totalVehicles").textContent = data.total ?? 0;
    document.getElementById("availableVehicles").textContent = data.available ?? 0;
    document.getElementById("unavailableVehicles").textContent = data.unavailable ?? 0;
    document.getElementById("totalBookings").textContent = data.totalRentals ?? 0;
  } catch (e) {
    ["totalVehicles","availableVehicles","unavailableVehicles","totalBookings"].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = "—";
    });
  }
}
