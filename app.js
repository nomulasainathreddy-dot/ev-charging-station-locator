// ===== Storage Keys =====
const LS_STATIONS = "ev_stations_v1";
const LS_THEME = "ev_theme_v1";

// ===== Default Stations =====
const defaultStations = [
  {
    id: "s1",
    name: "VoltPoint Charging Hub",
    area: "Madhapur, Hyderabad",
    distanceKm: 1.2,
    status: "Available",
    powerKw: 60,
    types: ["CCS2", "Type 2"],
    price: 15,
    rating: 4.6,
    open24: true,
    lat: 17.4483,
    lng: 78.3915
  },
  {
    id: "s2",
    name: "GreenCharge Station",
    area: "Gachibowli, Hyderabad",
    distanceKm: 3.8,
    status: "Busy",
    powerKw: 22,
    types: ["Type 2"],
    price: 12,
    rating: 4.2,
    open24: false,
    lat: 17.4401,
    lng: 78.3489
  },
  {
    id: "s3",
    name: "Highway FastCharge",
    area: "ORR Exit 12",
    distanceKm: 9.5,
    status: "Available",
    powerKw: 120,
    types: ["CCS2", "CHAdeMO"],
    price: 18,
    rating: 4.8,
    open24: true,
    lat: 17.3608,
    lng: 78.5125
  },
  {
    id: "s4",
    name: "CityMall EV Bay",
    area: "Kukatpally, Hyderabad",
    distanceKm: 6.1,
    status: "Offline",
    powerKw: 50,
    types: ["CCS2"],
    price: 16,
    rating: 4.0,
    open24: false,
    lat: 17.4933,
    lng: 78.3996
  }
];

// ===== Helpers =====
function loadStations() {
  const raw = localStorage.getItem(LS_STATIONS);
  if (!raw) {
    localStorage.setItem(LS_STATIONS, JSON.stringify(defaultStations));
    return [...defaultStations];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...defaultStations];
    return parsed;
  } catch {
    return [...defaultStations];
  }
}

function saveStations(stations) {
  localStorage.setItem(LS_STATIONS, JSON.stringify(stations));
}

function fmtTypes(arr) {
  return arr.join(" • ");
}

function badgeClass(status) {
  if (status === "Available") return "b-green";
  if (status === "Busy") return "b-yellow";
  return "b-red";
}

function isFast(powerKw) {
  return Number(powerKw) >= 50;
}

// ===== Theme Toggle =====
function initTheme() {
  const saved = localStorage.getItem(LS_THEME);
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
  const btn = document.getElementById("themeBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(LS_THEME, next);
    });
  }
}

// ===== Home Page Logic =====
let allStations = [];
let filtered = [];

let map, markersLayer;

function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  map = L.map("map").setView([17.3850, 78.4867], 11); // Hyderabad-ish
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

function clearMarkers() {
  if (markersLayer) markersLayer.clearLayers();
}

function addMarkers(list) {
  if (!map || !markersLayer) return;
  clearMarkers();

  list.forEach(s => {
    const m = L.marker([s.lat, s.lng]).addTo(markersLayer);
    m.bindPopup(
      `<b>${s.name}</b><br>${s.area}<br>${s.powerKw}kW • ₹${s.price}/kWh • ⭐${s.rating}`
    );
    m.on("click", () => {
      map.setView([s.lat, s.lng], 14);
    });
  });

  // Map footer stats
  const mCount = document.getElementById("mCount");
  const mAvgPrice = document.getElementById("mAvgPrice");
  const mAvgRating = document.getElementById("mAvgRating");
  if (mCount) mCount.textContent = String(list.length);

  if (list.length > 0) {
    const avgPrice = (list.reduce((a, x) => a + x.price, 0) / list.length).toFixed(1);
    const avgRating = (list.reduce((a, x) => a + x.rating, 0) / list.length).toFixed(2);
    if (mAvgPrice) mAvgPrice.textContent = `₹${avgPrice}`;
    if (mAvgRating) mAvgRating.textContent = avgRating;
  } else {
    if (mAvgPrice) mAvgPrice.textContent = "—";
    if (mAvgRating) mAvgRating.textContent = "—";
  }
}

function updateKPIs(list) {
  const kStations = document.getElementById("kStations");
  const kAvailable = document.getElementById("kAvailable");
  const kFast = document.getElementById("kFast");

  if (kStations) kStations.textContent = String(list.length);
  if (kAvailable) kAvailable.textContent = String(list.filter(s => s.status === "Available").length);
  if (kFast) kFast.textContent = String(list.filter(s => isFast(s.powerKw)).length);
}

function renderCards(list) {
  const wrap = document.getElementById("cards");
  const empty = document.getElementById("emptyState");
  if (!wrap) return;

  wrap.innerHTML = "";
  if (list.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  list.forEach(s => {
    const card = document.createElement("div");
    card.className = "station";

    card.innerHTML = `
      <div class="station-top">
        <div>
          <div class="station-name">${s.name}</div>
          <div class="muted small station-sub">${s.area} • ${s.distanceKm.toFixed(1)} km</div>
        </div>
        <div class="badge ${badgeClass(s.status)}">${s.status}</div>
      </div>

      <div class="meta">
        <span>⚡ ${s.powerKw} kW</span>
        <span>🔌 ${fmtTypes(s.types)}</span>
        <span>₹${s.price}/kWh</span>
        <span>⭐ ${s.rating}</span>
        <span>${s.open24 ? "🕐 24/7" : "🕘 Timed"}</span>
      </div>

      <div class="station-actions">
        <a class="link" href="station.html?id=${encodeURIComponent(s.id)}">View Details</a>
        <div class="actions-right">
          <button class="btn btn-ghost" data-zoom="${s.id}">Zoom Map</button>
          <button class="btn" data-book="${s.id}">Book</button>
        </div>
      </div>
    `;

    wrap.appendChild(card);
  });

  // Attach actions
  wrap.querySelectorAll("[data-zoom]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-zoom");
      const st = list.find(x => x.id === id);
      if (st && map) map.setView([st.lat, st.lng], 14);
    });
  });

  wrap.querySelectorAll("[data-book]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-book");
      const st = allStations.find(x => x.id === id);
      if (st) openBooking(st);
    });
  });
}

function getFilters() {
  const q = (document.getElementById("q")?.value || "").trim().toLowerCase();
  const type = document.getElementById("type")?.value || "any";
  const status = document.getElementById("status")?.value || "any";
  const minPower = Number(document.getElementById("minPower")?.value || 0);
  const maxPrice = Number(document.getElementById("maxPrice")?.value || 999);
  const sort = document.getElementById("sort")?.value || "distance";
  return { q, type, status, minPower, maxPrice, sort };
}

function applyFilters() {
  const { q, type, status, minPower, maxPrice, sort } = getFilters();

  let list = allStations.filter(s => {
    const matchesQ =
      q === "" ||
      s.name.toLowerCase().includes(q) ||
      s.area.toLowerCase().includes(q);

    const matchesType =
      type === "any" || s.types.includes(type);

    const matchesStatus =
      status === "any" || s.status === status;

    const matchesPower =
      Number(s.powerKw) >= minPower;

    const matchesPrice =
      Number(s.price) <= maxPrice;

    return matchesQ && matchesType && matchesStatus && matchesPower && matchesPrice;
  });

  // sort
  list.sort((a, b) => {
    if (sort === "distance") return a.distanceKm - b.distanceKm;
    if (sort === "price") return a.price - b.price;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "power") return b.powerKw - a.powerKw;
    return 0;
  });

  filtered = list;

  const resultText = document.getElementById("resultText");
  if (resultText) {
    resultText.textContent = list.length === allStations.length
      ? "Showing all stations"
      : `Showing ${list.length} result(s)`;
  }

  updateKPIs(list);
  renderCards(list);
  addMarkers(list);
}

function resetFilters() {
  const qEl = document.getElementById("q");
  const typeEl = document.getElementById("type");
  const statusEl = document.getElementById("status");
  const minPowerEl = document.getElementById("minPower");
  const maxPriceEl = document.getElementById("maxPrice");
  const sortEl = document.getElementById("sort");

  if (qEl) qEl.value = "";
  if (typeEl) typeEl.value = "any";
  if (statusEl) statusEl.value = "any";
  if (minPowerEl) minPowerEl.value = "0";
  if (maxPriceEl) maxPriceEl.value = "999";
  if (sortEl) sortEl.value = "distance";

  applyFilters();
}

// ===== Quick Chips =====
function initQuickChips() {
  document.querySelectorAll(".chip[data-quick]").forEach(chip => {
    chip.addEventListener("click", () => {
      const mode = chip.getAttribute("data-quick");

      if (mode === "fast") {
        const minPowerEl = document.getElementById("minPower");
        if (minPowerEl) minPowerEl.value = "50";
      }
      if (mode === "open") {
        // no dedicated filter dropdown, so we use search helper keyword
        const qEl = document.getElementById("q");
        if (qEl) qEl.value = (qEl.value + " 24/7").trim();
      }
      if (mode === "available") {
        const statusEl = document.getElementById("status");
        if (statusEl) statusEl.value = "Available";
      }
      if (mode === "near") {
        // If user location available, map will center and distances are demo.
        useMyLocation();
      }
      applyFilters();
    });
  });
}

// ===== Location Button =====
function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported on this device/browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (map) {
        map.setView([latitude, longitude], 14);
        L.circle([latitude, longitude], { radius: 250 }).addTo(map);
      }
    },
    () => alert("Location permission denied.")
  );
}

// ===== Booking Modal (Simulation) =====
let bookingStation = null;

function openBooking(station) {
  bookingStation = station;
  const modal = document.getElementById("modal");
  const title = document.getElementById("modalTitle");
  const sub = document.getElementById("modalSub");

  if (title) title.textContent = `Book Slot • ${station.name}`;
  if (sub) sub.textContent = `${station.area} • ${station.powerKw}kW • ₹${station.price}/kWh`;

  // default date = today
  const dateEl = document.getElementById("bookDate");
  if (dateEl) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  if (modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeBooking() {
  bookingStation = null;
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
}

function initBooking() {
  const closeBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBook");
  const confirmBtn = document.getElementById("confirmBook");
  const modal = document.getElementById("modal");

  if (closeBtn) closeBtn.addEventListener("click", closeBooking);
  if (cancelBtn) cancelBtn.addEventListener("click", closeBooking);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeBooking();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const date = document.getElementById("bookDate")?.value || "";
      const time = document.getElementById("bookTime")?.value || "";
      const vehicle = (document.getElementById("bookVehicle")?.value || "").trim();

      if (!bookingStation) return;

      if (!date || !time) {
        alert("Please select date and time.");
        return;
      }
      if (vehicle.length < 6) {
        alert("Enter a valid vehicle number (demo).");
        return;
      }

      alert(
        `✅ Booking Confirmed!\n\nStation: ${bookingStation.name}\nDate: ${date}\nTime: ${time}\nVehicle: ${vehicle}\n\n(UI demo only)`
      );
      closeBooking();
    });
  }
}

// ===== Page Init =====
function initHomePage() {
  if (!document.getElementById("cards")) return; // not home page

  allStations = loadStations();

  initMap();
  initQuickChips();
  initBooking();

  // Events
  document.getElementById("applyBtn")?.addEventListener("click", applyFilters);
  document.getElementById("searchBtn")?.addEventListener("click", applyFilters);
  document.getElementById("resetBtn")?.addEventListener("click", resetFilters);
  document.getElementById("locBtn")?.addEventListener("click", useMyLocation);

  // Enter key search
  document.getElementById("q")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilters();
  });

  // initial
  applyFilters();
}

// ===== Station Details Page =====
function initStationDetails() {
  const detailsRoot = document.getElementById("stationDetails");
  if (!detailsRoot) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const stations = loadStations();
  const st = stations.find(x => x.id === id) || stations[0];

  detailsRoot.innerHTML = `
    <div class="station">
      <div class="station-top">
        <div>
          <div class="station-name">${st.name}</div>
          <div class="muted small station-sub">${st.area} • ${st.distanceKm.toFixed(1)} km</div>
        </div>
        <div class="badge ${badgeClass(st.status)}">${st.status}</div>
      </div>

      <div class="meta">
        <span>⚡ ${st.powerKw} kW</span>
        <span>🔌 ${fmtTypes(st.types)}</span>
        <span>₹${st.price}/kWh</span>
        <span>⭐ ${st.rating}</span>
        <span>${st.open24 ? "🕐 24/7" : "🕘 Timed"}</span>
      </div>

      <div style="margin-top:12px" class="muted small">
        <b>Demo info:</b> You can add real address, amenities, connectors count, and working payment system later.
      </div>

      <div class="station-actions">
        <a class="link" href="index.html">← Back to Home</a>
        <div class="actions-right">
          <button class="btn btn-ghost" id="detailsBook">Book</button>
          <a class="btn" href="https://www.google.com/maps?q=${st.lat},${st.lng}" target="_blank" rel="noreferrer">Navigate</a>
        </div>
      </div>
    </div>
  `;

  // details map
  const mapEl = document.getElementById("detailsMap");
  if (mapEl) {
    const m = L.map("detailsMap").setView([st.lat, st.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(m);
    L.marker([st.lat, st.lng]).addTo(m).bindPopup(st.name).openPopup();
  }

  // booking modal same as home
  initBooking();
  document.getElementById("detailsBook")?.addEventListener("click", () => openBooking(st));
}

// ===== Admin Page (Add Station to LocalStorage) =====
function initAdmin() {
  const form = document.getElementById("adminForm");
  if (!form) return;

  const listEl = document.getElementById("adminList");
  const stations = loadStations();
  renderAdminList(stations);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("aName").value.trim();
    const area = document.getElementById("aArea").value.trim();
    const status = document.getElementById("aStatus").value;
    const powerKw = Number(document.getElementById("aPower").value);
    const price = Number(document.getElementById("aPrice").value);
    const rating = Number(document.getElementById("aRating").value);
    const open24 = document.getElementById("aOpen24").checked;
    const lat = Number(document.getElementById("aLat").value);
    const lng = Number(document.getElementById("aLng").value);

    const typesRaw = document.getElementById("aTypes").value.trim();
    const types = typesRaw
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);

    if (!name || !area || types.length === 0) {
      alert("Please fill Name, Area, and Types (comma separated).");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert("Please enter valid lat/lng numbers.");
      return;
    }

    const newStation = {
      id: "s" + Math.random().toString(16).slice(2, 8),
      name,
      area,
      distanceKm: 5.0, // demo default (later calculate with location)
      status,
      powerKw,
      types,
      price,
      rating,
      open24,
      lat,
      lng
    };

    const updated = loadStations();
    updated.unshift(newStation);
    saveStations(updated);

    alert("✅ Station added (saved in browser LocalStorage). Open Home page to see it.");
    form.reset();
    renderAdminList(updated);
  });

  function renderAdminList(stationsList){
    if (!listEl) return;
    listEl.innerHTML = "";
    stationsList.slice(0, 8).forEach(s => {
      const row = document.createElement("div");
      row.className = "station";
      row.innerHTML = `
        <div class="station-top">
          <div>
            <div class="station-name">${s.name}</div>
            <div class="muted small">${s.area}</div>
          </div>
          <div class="badge ${badgeClass(s.status)}">${s.status}</div>
        </div>
        <div class="meta">
          <span>⚡ ${s.powerKw} kW</span>
          <span>₹${s.price}/kWh</span>
          <span>🔌 ${fmtTypes(s.types)}</span>
        </div>
      `;
      listEl.appendChild(row);
    });
  }
}

// ===== Boot =====
initTheme();
initHomePage();
initStationDetails();
initAdmin();
