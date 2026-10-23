/**
 * Foody — GastronomIA con Google Maps
 * Complete Interactive Application Engine
 * Handles Collapsible Sidebar, View Switching, Chat, Map Explorer & Visited Reviews
 */

document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    activeView: "inicio",
    miniMap: null,
    explorerMap: null,
    miniMarkersCluster: null,
    explorerMarkersCluster: null,
    activeVenues: [],
    selectedBarrio: "",
    activeDietaryFilters: new Set(),
    chatHistory: [],
    favorites: JSON.parse(localStorage.getItem("foody_favs") || "[]"),
    visitedPlaces: JSON.parse(localStorage.getItem("foody_visited_places") || "[]"),
    isWaitingResponse: false,
    selectedReviewVenue: null
  };

  // Topbar Elements
  const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
  const brandHomeLink = document.getElementById("brand-home-link");
  const globalSearchForm = document.getElementById("global-search-form");
  const globalSearchInput = document.getElementById("global-search-input");
  const btnAccessibility = document.getElementById("btn-accessibility");
  const btnStats = document.getElementById("btn-stats");

  // Navigation Pills
  const navPills = document.querySelectorAll(".nav-pill");
  const viewPanels = {
    "inicio": document.getElementById("view-inicio"),
    "chat": document.getElementById("view-chat"),
    "explorar": document.getElementById("view-explorar"),
    "mis-lugares": document.getElementById("view-lugares"),
    "favoritos": document.getElementById("view-favoritos")
  };

  // View 1 (Inicio) Elements
  const heroPromptForm = document.getElementById("hero-prompt-form");
  const heroInput = document.getElementById("hero-input");
  const barrioSelect = document.getElementById("barrio-select");
  const streamHeader = document.getElementById("stream-header");
  const streamTitle = document.getElementById("stream-title");
  const streamCounter = document.getElementById("stream-counter");
  const resultsContainer = document.getElementById("results-container");

  // View 2 (Chat) Elements
  const chatFullForm = document.getElementById("chat-full-form");
  const chatFullInput = document.getElementById("chat-full-input");
  const chatFullMessages = document.getElementById("chat-full-messages");
  const btnClearChat = document.getElementById("btn-clear-chat");

  // View 3 (Explorer Map) Elements
  const explorerBarrioSelect = document.getElementById("explorer-barrio-select");
  const explorerVenuesCount = document.getElementById("explorer-venues-count");
  const btnExplorerRecenter = document.getElementById("btn-explorer-recenter");

  // View 4 (Mis Lugares) Elements
  const btnAddVisitedManual = document.getElementById("btn-add-visited-manual");
  const visitedCardsGrid = document.getElementById("visited-cards-grid");
  const metricVisitedTotal = document.getElementById("metric-visited-total");
  const metricAvgRating = document.getElementById("metric-avg-rating");
  const metricFavoriteZone = document.getElementById("metric-favorite-zone");

  // Modals & Drawers
  const venueDrawer = document.getElementById("venue-drawer");
  const drawerClose = document.getElementById("drawer-close");
  const drawerMarkVisited = document.getElementById("drawer-mark-visited");
  const modalSafety = document.getElementById("modal-safety");
  const modalSafetyClose = document.getElementById("modal-safety-close");
  const btnSafetyUnderstood = document.getElementById("btn-safety-understood");
  const modalStats = document.getElementById("modal-stats");
  const modalStatsClose = document.getElementById("modal-stats-close");
  const btnStatsClose = document.getElementById("btn-stats-close");

  // Review Modal Elements
  const modalReview = document.getElementById("modal-review");
  const modalReviewClose = document.getElementById("modal-review-close");
  const btnReviewCancel = document.getElementById("btn-review-cancel");
  const formReview = document.getElementById("form-review");
  const reviewVenueName = document.getElementById("review-venue-name");
  const reviewVenueBarrio = document.getElementById("review-venue-barrio");
  const reviewRating = document.getElementById("review-rating");
  const reviewComment = document.getElementById("review-comment");
  const reviewDate = document.getElementById("review-date");
  const ratingValDisplay = document.getElementById("rating-val-display");
  const starBtns = document.querySelectorAll(".star-btn");

  // CABA Center Coordinates
  const CABA_CENTER = [-34.6037, -58.3816];

  // Initialize Application
  initMiniMap();
  loadBarrios();
  loadStats();
  setupEventListeners();
  loadInitialVenues();
  renderVisitedMetrics();

  // Set default review date to today
  if (reviewDate) {
    reviewDate.value = new Date().toISOString().split("T")[0];
  }

  /* ==========================================================================
     1. SIDEBAR COLLAPSE TOGGLE
     ========================================================================== */
  btnToggleSidebar.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
    setTimeout(() => {
      if (state.miniMap) state.miniMap.invalidateSize();
      if (state.explorerMap) state.explorerMap.invalidateSize();
    }, 250);
  });

  /* ==========================================================================
     2. VIEW SWITCHING ARCHITECTURE
     ========================================================================== */
  function switchView(viewName) {
    state.activeView = viewName;

    // Update nav pills
    navPills.forEach(pill => {
      const pillNav = pill.getAttribute("data-nav");
      pill.classList.toggle("active", pillNav === viewName);
    });

    // Toggle panels
    Object.keys(viewPanels).forEach(key => {
      if (viewPanels[key]) {
        viewPanels[key].style.display = key === viewName ? "block" : "none";
      }
    });

    // Adjust full-canvas-view mode (hides right mini sidebar in full modes)
    if (viewName === "chat" || viewName === "explorar" || viewName === "mis-lugares" || viewName === "favoritos") {
      document.body.classList.add("full-canvas-view");
    } else {
      document.body.classList.remove("full-canvas-view");
    }

    // View specific actions
    if (viewName === "explorar") {
      initExplorerMap();
      setTimeout(() => {
        if (state.explorerMap) state.explorerMap.invalidateSize();
      }, 200);
    } else if (viewName === "chat") {
      if (!window.matchMedia("(pointer: coarse)").matches) {
        setTimeout(() => chatFullInput.focus(), 150);
      }
    } else if (viewName === "mis-lugares") {
      renderVisitedPlaces();
    } else if (viewName === "favoritos") {
      renderFavoritesView();
    } else if (viewName === "inicio") {
      setTimeout(() => {
        if (state.miniMap) state.miniMap.invalidateSize();
      }, 200);
    }
  }

  // Bind nav pills
  navPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const targetNav = pill.getAttribute("data-nav");
      if (targetNav) switchView(targetNav);
    });
  });

  brandHomeLink.addEventListener("click", () => switchView("inicio"));

  // Experiences card in right sidebar opens "Mis Lugares"
  const cardExperiencias = document.getElementById("card-trigger-experiencias");
  if (cardExperiencias) {
    cardExperiencias.addEventListener("click", () => switchView("mis-lugares"));
  }

  // "Abrir en Maps" buttons switch to Explorar view
  document.getElementById("btn-open-maps").addEventListener("click", () => switchView("explorar"));
  document.getElementById("btn-recenter").addEventListener("click", () => switchView("explorar"));

  /* ==========================================================================
     3. LEAFLET MAPS: MINI MAP & EXPLORER MAP
     ========================================================================== */
  function createCustomPin(venue) {
    let pinColor = "#ea4335";
    let iconSymbol = "📍";

    if (venue.es_sin_tacc && venue.es_sin_tacc.startsWith("Apto")) {
      pinColor = "#fbbc04";
      iconSymbol = "🌾";
    } else if (venue.es_vegano && venue.es_vegano.startsWith("Apto")) {
      pinColor = "#34a853";
      iconSymbol = "🌱";
    } else if (venue.tipo_categoria === "Cafetería") {
      pinColor = "#4285f4";
      iconSymbol = "☕";
    }

    const html = `
      <div style="
        background: ${pinColor};
        color: #ffffff;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        border: 2px solid #ffffff;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${iconSymbol}
      </div>
    `;

    return L.divIcon({
      html: html,
      className: "custom-div-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  }

  function initMiniMap() {
    state.miniMap = L.map("map", {
      zoomControl: true,
      attributionControl: false
    }).setView(CABA_CENTER, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(state.miniMap);

    if (typeof L.markerClusterGroup === "function") {
      state.miniMarkersCluster = L.markerClusterGroup({
        maxClusterRadius: 40,
        chunkedLoading: true
      });
      state.miniMap.addLayer(state.miniMarkersCluster);
    }
  }

  function initExplorerMap() {
    if (state.explorerMap) {
      state.explorerMap.invalidateSize();
      return;
    }

    state.explorerMap = L.map("explorer-map", {
      zoomControl: true,
      attributionControl: false
    }).setView(CABA_CENTER, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(state.explorerMap);

    if (typeof L.markerClusterGroup === "function") {
      state.explorerMarkersCluster = L.markerClusterGroup({
        maxClusterRadius: 45,
        chunkedLoading: true
      });
      state.explorerMap.addLayer(state.explorerMarkersCluster);
    }

    // Populate explorer map if venues exist
    if (state.activeVenues && state.activeVenues.length > 0) {
      plotOnExplorerMap(state.activeVenues, false);
    }
  }

  function plotOnExplorerMap(venues, fit = true) {
    if (!state.explorerMap || !state.explorerMarkersCluster) return;
    state.explorerMarkersCluster.clearLayers();

    const bounds = L.latLngBounds();
    const batch = [];

    venues.forEach(v => {
      if (!v.latitud || !v.longitud) return;
      const latLng = [v.latitud, v.longitud];
      bounds.extend(latLng);

      const marker = L.marker(latLng, { icon: createCustomPin(v) });
      marker.on("click", () => showVenueDrawer(v));
      batch.push(marker);
    });

    state.explorerMarkersCluster.addLayers(batch);
    explorerVenuesCount.textContent = `${Number(venues.length).toLocaleString("es-AR")} locales en mapa`;

    if (fit && bounds.isValid()) {
      state.explorerMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }

  function plotVenuesOnMap(venues, shouldFitBounds = true) {
    state.activeVenues = venues;
    if (state.miniMarkersCluster) {
      state.miniMarkersCluster.clearLayers();
      const bounds = L.latLngBounds();
      const batch = [];

      venues.forEach(v => {
        if (!v.latitud || !v.longitud) return;
        const latLng = [v.latitud, v.longitud];
        bounds.extend(latLng);

        const marker = L.marker(latLng, { icon: createCustomPin(v) });
        marker.on("click", () => showVenueDrawer(v));
        batch.push(marker);
      });

      state.miniMarkersCluster.addLayers(batch);
      if (shouldFitBounds && bounds.isValid()) {
        state.miniMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }
    }

    if (state.explorerMap) {
      plotOnExplorerMap(venues, shouldFitBounds);
    }
  }

  async function loadInitialVenues() {
    try {
      const res = await fetch("/api/map-points");
      const data = await res.json();
      if (data && data.points) {
        plotVenuesOnMap(data.points, false);
        explorerVenuesCount.textContent = `${Number(data.total).toLocaleString("es-AR")} locales en mapa`;
      }
    } catch (e) {
      console.warn("Could not load map points:", e);
    }
  }

  /* ==========================================================================
     4. DATA LOADING: BARRIOS & STATS
     ========================================================================== */
  async function loadBarrios() {
    try {
      const res = await fetch("/api/barrios");
      const barrios = await res.json();
      barrios.forEach(b => {
        if (!b.nombre || b.nombre.includes("CABA / GBA") || b.nombre === "No especificado") return;
        const opt1 = document.createElement("option");
        opt1.value = b.nombre;
        opt1.textContent = `${b.nombre} (${b.count})`;
        barrioSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = b.nombre;
        opt2.textContent = `${b.nombre} (${b.count})`;
        explorerBarrioSelect.appendChild(opt2);
      });
    } catch (e) {
      console.error("Error loading barrios:", e);
    }
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/stats");
      const s = await res.json();
      if (s) {
        document.getElementById("stat-total").textContent = Number(s.total_establecimientos).toLocaleString("es-AR");
        document.getElementById("stat-caba").textContent = Number(s.caba_total || 5500).toLocaleString("es-AR");
        document.getElementById("stat-gba").textContent = Number(s.gba_total || 2681).toLocaleString("es-AR");
        document.getElementById("stat-sin-tacc").textContent = s.apto_sin_tacc || "0";
        document.getElementById("stat-vegano").textContent = s.apto_vegano || "0";
        document.getElementById("stat-vegetariano").textContent = s.apto_vegetariano || "0";
      }
    } catch (e) {
      console.error("Error loading stats:", e);
    }
  }

  /* ==========================================================================
     5. VENUE DRAWER & FAVORITES
     ========================================================================== */
  function showVenueDrawer(venue) {
    state.selectedReviewVenue = venue;
    document.getElementById("drawer-title").textContent = venue.nombre;
    document.getElementById("drawer-tag").textContent = venue.tipo_categoria || venue.tipo_establecimiento || "Gastronomía";
    document.getElementById("drawer-cuisine").textContent = `Cocina: ${venue.cocina || 'Variada'}`;
    document.getElementById("drawer-address").textContent = `📍 ${venue.direccion || 'Sin dirección exacta'}, ${venue.barrio_localidad}`;
    document.getElementById("drawer-source").textContent = `Fuente: ${venue.fuente_dato || 'OpenStreetMap / BA Data'}`;

    const dietContainer = document.getElementById("drawer-dietary");
    dietContainer.innerHTML = "";
    if (venue.es_sin_tacc && venue.es_sin_tacc.startsWith("Apto")) {
      dietContainer.innerHTML += `<span class="card-badge badge-sin-tacc">🌾 Sin TACC</span>`;
    }
    if (venue.es_vegano && venue.es_vegano.startsWith("Apto")) {
      dietContainer.innerHTML += `<span class="card-badge badge-vegano">🌱 Vegano</span>`;
    }
    if (venue.es_vegetariano && venue.es_vegetariano.startsWith("Apto")) {
      dietContainer.innerHTML += `<span class="card-badge badge-veggie">🥗 Vegetariano</span>`;
    }

    const telBtn = document.getElementById("drawer-tel");
    if (venue.telefono) {
      telBtn.href = `tel:${venue.telefono.replace(/\s+/g, '')}`;
      telBtn.style.display = "inline-flex";
      telBtn.innerHTML = `<span>📞</span> Llamar (${escapeHtml(venue.telefono)})`;
    } else {
      telBtn.style.display = "none";
    }

    const webBtn = document.getElementById("drawer-web");
    if (venue.website) {
      let url = venue.website.trim();
      if (!url.startsWith("http")) url = "https://" + url;
      webBtn.href = url;
      webBtn.style.display = "inline-flex";
    } else {
      webBtn.style.display = "none";
    }

    const favBtn = document.getElementById("drawer-fav");
    const isFav = state.favorites.some(f => f.id === venue.id || f.nombre === venue.nombre);
    favBtn.innerHTML = isFav ? `<span>❤️</span> Favorito` : `<span>🤍</span> Favorito`;
    favBtn.onclick = () => {
      toggleFavorite(venue);
      const nowFav = state.favorites.some(f => f.id === venue.id || f.nombre === venue.nombre);
      favBtn.innerHTML = nowFav ? `<span>❤️</span> Favorito` : `<span>🤍</span> Favorito`;
    };

    drawerMarkVisited.onclick = () => {
      openReviewModal(venue);
    };

    venueDrawer.classList.remove("hidden");
  }

  function toggleFavorite(venue) {
    const idx = state.favorites.findIndex(f => f.id === venue.id || f.nombre === venue.nombre);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
    } else {
      state.favorites.push(venue);
    }
    localStorage.setItem("foody_favs", JSON.stringify(state.favorites));
    if (state.activeView === "favoritos") renderFavoritesView();
  }

  function renderFavoritesView() {
    const container = document.getElementById("favs-cards-grid");
    container.innerHTML = "";
    if (state.favorites.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; background: #ffffff; padding: 2.5rem; border-radius: 20px; border: 1px solid #e8eaed; text-align: center;">
          <p style="font-size: 1.2rem; font-weight: 700; color: #3c4043;">Todavía no guardaste ningún favorito 🤍</p>
          <p style="color: #5f6368; margin-top: 0.5rem;">Hacé clic en el corazón de cualquier restaurante para tenerlo a mano acá.</p>
        </div>
      `;
      return;
    }
    state.favorites.forEach(v => {
      container.appendChild(createVenueCardElement(v));
    });
  }

  /* ==========================================================================
     6. MIS LUGARES VISITADOS Y RESEÑAS
     ========================================================================== */
  function openReviewModal(venue = null, existingReview = null) {
    state.selectedReviewVenue = venue;
    if (venue) {
      reviewVenueName.value = venue.nombre || "";
      reviewVenueBarrio.value = venue.barrio_localidad || "";
    } else {
      reviewVenueName.value = "";
      reviewVenueBarrio.value = "";
    }

    if (existingReview) {
      document.getElementById("modal-review-title").textContent = "Editar Reseña";
      reviewVenueName.value = existingReview.nombre;
      reviewVenueBarrio.value = existingReview.barrio || "";
      setStarRating(existingReview.rating || 5);
      reviewComment.value = existingReview.comment || "";
      reviewDate.value = existingReview.date || new Date().toISOString().split("T")[0];
    } else {
      document.getElementById("modal-review-title").textContent = "Dejar Reseña de Experiencia";
      setStarRating(5);
      reviewComment.value = "";
      reviewDate.value = new Date().toISOString().split("T")[0];
    }

    modalReview.classList.remove("hidden");
  }

  function setStarRating(val) {
    reviewRating.value = val;
    ratingValDisplay.textContent = `${val} / 5 estrellas`;
    starBtns.forEach(btn => {
      const starVal = parseInt(btn.getAttribute("data-val"));
      btn.classList.toggle("active", starVal <= val);
    });
  }

  starBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setStarRating(parseInt(btn.getAttribute("data-val")));
    });
  });

  formReview.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = reviewVenueName.value.trim();
    const barrio = reviewVenueBarrio.value.trim();
    const rating = parseInt(reviewRating.value) || 5;
    const comment = reviewComment.value.trim();
    const date = reviewDate.value || new Date().toISOString().split("T")[0];

    if (!name) return;

    // Check if place already reviewed, update or append
    const existingIdx = state.visitedPlaces.findIndex(p => p.nombre.toLowerCase() === name.toLowerCase());
    const reviewData = {
      id: state.selectedReviewVenue ? state.selectedReviewVenue.id : Date.now(),
      nombre: name,
      barrio: barrio,
      rating: rating,
      comment: comment,
      date: date
    };

    if (existingIdx >= 0) {
      state.visitedPlaces[existingIdx] = reviewData;
    } else {
      state.visitedPlaces.unshift(reviewData);
    }

    localStorage.setItem("foody_visited_places", JSON.stringify(state.visitedPlaces));
    modalReview.classList.add("hidden");
    renderVisitedMetrics();
    renderVisitedPlaces();
    switchView("mis-lugares");
  });

  function renderVisitedMetrics() {
    metricVisitedTotal.textContent = state.visitedPlaces.length;
    if (state.visitedPlaces.length === 0) {
      metricAvgRating.textContent = "0.0";
      metricFavoriteZone.textContent = "--";
      return;
    }

    const sum = state.visitedPlaces.reduce((acc, p) => acc + (p.rating || 5), 0);
    metricAvgRating.textContent = (sum / state.visitedPlaces.length).toFixed(1);

    // Find top barrio
    const counts = {};
    state.visitedPlaces.forEach(p => {
      if (p.barrio) counts[p.barrio] = (counts[p.barrio] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    metricFavoriteZone.textContent = sorted.length > 0 ? sorted[0][0] : "CABA";
  }

  function renderVisitedPlaces() {
    renderVisitedMetrics();
    visitedCardsGrid.innerHTML = "";

    if (state.visitedPlaces.length === 0) {
      visitedCardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; background: #ffffff; padding: 2.5rem; border-radius: 20px; border: 1px solid #e8eaed; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🍽️✨</div>
          <p style="font-size: 1.2rem; font-weight: 700; color: #3c4043;">Todavía no agregaste lugares a tu diario</p>
          <p style="color: #5f6368; margin-top: 0.4rem; max-width: 480px; margin-left: auto; margin-right: auto;">
            Marcá los restaurantes que visitás para registrar qué comiste, tus platos preferidos y puntuaciones personales.
          </p>
          <button class="btn-add-visited" style="margin-top: 1.25rem;" id="btn-empty-add-visited">
            <span>➕</span> Agregar Primer Lugar
          </button>
        </div>
      `;
      document.getElementById("btn-empty-add-visited").addEventListener("click", () => openReviewModal());
      return;
    }

    state.visitedPlaces.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "visited-card";

      const stars = "⭐".repeat(item.rating || 5);

      card.innerHTML = `
        <div>
          <div class="visited-card-header">
            <h4 class="visited-card-title">${escapeHtml(item.nombre)}</h4>
            <span class="visited-card-stars">${stars}</span>
          </div>
          <div class="visited-card-barrio">📍 ${escapeHtml(item.barrio || 'Buenos Aires')}</div>
          <div class="visited-card-comment">"${escapeHtml(item.comment)}"</div>
        </div>
        <div class="visited-card-footer">
          <span>Visita: ${item.date || 'Reciente'}</span>
          <div>
            <button class="btn-delete-visited" data-idx="${index}">Eliminar</button>
          </div>
        </div>
      `;

      card.querySelector(".btn-delete-visited").addEventListener("click", () => {
        state.visitedPlaces.splice(index, 1);
        localStorage.setItem("foody_visited_places", JSON.stringify(state.visitedPlaces));
        renderVisitedPlaces();
      });

      visitedCardsGrid.appendChild(card);
    });
  }

  btnAddVisitedManual.addEventListener("click", () => openReviewModal());

  /* ==========================================================================
     7. VENUE CARD COMPONENT
     ========================================================================== */
  function createVenueCardElement(v) {
    const isFav = state.favorites.some(f => f.id === v.id || f.nombre === v.nombre);
    const card = document.createElement("div");
    card.className = "venue-card";

    let badgesHtml = "";
    if (v.es_sin_tacc && v.es_sin_tacc.startsWith("Apto")) badgesHtml += `<span class="card-badge badge-sin-tacc">🌾 Sin TACC</span>`;
    if (v.es_vegano && v.es_vegano.startsWith("Apto")) badgesHtml += `<span class="card-badge badge-vegano">🌱 Vegano</span>`;
    if (v.es_vegetariano && v.es_vegetariano.startsWith("Apto")) badgesHtml += `<span class="card-badge badge-veggie">🥗 Vegetariano</span>`;

    let actionsHtml = "";
    if (v.telefono) {
      actionsHtml += `<a href="tel:${v.telefono.replace(/\s+/g, '')}" class="card-action-btn card-btn-call" target="_blank">📞 Llamar</a>`;
    }
    if (v.website) {
      let cleanWeb = v.website.trim();
      if (!cleanWeb.startsWith("http")) cleanWeb = "https://" + cleanWeb;
      actionsHtml += `<a href="${cleanWeb}" class="card-action-btn card-btn-web" target="_blank">🌐 Web</a>`;
    }

    card.innerHTML = `
      <div>
        <div class="venue-card-header">
          <h4 class="venue-card-title">${escapeHtml(v.nombre)}</h4>
          <button class="btn-card-fav ${isFav ? 'saved' : ''}" title="Guardar favorito">${isFav ? '❤️' : '🤍'}</button>
        </div>
        <div class="venue-card-tag">${escapeHtml(v.tipo_categoria || v.tipo_establecimiento || 'Gastronomía')} &bull; ${escapeHtml(v.cocina || 'Variada')}</div>
        <div class="venue-card-address">📍 ${escapeHtml(v.direccion || 'Ubicación en mapa')}, ${escapeHtml(v.barrio_localidad)}</div>
        ${badgesHtml ? `<div class="venue-card-badges">${badgesHtml}</div>` : ''}
      </div>
      ${actionsHtml ? `<div class="venue-card-actions">${actionsHtml}</div>` : ''}
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-card-fav")) {
        e.stopPropagation();
        toggleFavorite(v);
        const favBtn = card.querySelector(".btn-card-fav");
        const nowFav = state.favorites.some(f => f.id === v.id || f.nombre === v.nombre);
        favBtn.innerHTML = nowFav ? '❤️' : '🤍';
        favBtn.classList.toggle("saved", nowFav);
        return;
      }
      if (e.target.closest("a")) return;
      showVenueDrawer(v);
      if (v.latitud && v.longitud && state.miniMap) {
        state.miniMap.setView([v.latitud, v.longitud], 16, { animate: true });
      }
    });

    return card;
  }

  function displayVenuesCards(venues, title = "Sugerencias gastronómicas") {
    streamHeader.style.display = "flex";
    streamTitle.textContent = title;
    streamCounter.textContent = `${venues.length} opciones encontradas`;
    resultsContainer.innerHTML = "";

    if (!venues || venues.length === 0) {
      resultsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; background: #ffffff; padding: 2rem; border-radius: 16px; border: 1px solid #e8eaed; text-align: center;">
          <p style="font-size: 1.1rem; color: #5f6368;">No se encontraron resultados para esta búsqueda.</p>
        </div>
      `;
      return;
    }

    venues.forEach(v => {
      resultsContainer.appendChild(createVenueCardElement(v));
    });

    resultsContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ==========================================================================
     8. CHAT ENGINE (VIEW 2 & HERO INTEGRATION)
     ========================================================================== */
  async function submitQuery(queryText, openInChatView = false) {
    if (!queryText || state.isWaitingResponse) return;
    state.isWaitingResponse = true;

    if (openInChatView) {
      switchView("chat");
    }

    // Append user message in full chat view
    appendChatBubble("user", queryText);
    const thinkingBubble = appendChatBubble("bot", "Foody está consultando la base de datos oficial...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: state.chatHistory.slice(-6)
        })
      });
      const data = await res.json();
      thinkingBubble.remove();

      if (data && data.reply) {
        appendChatBubble("bot", data.reply);
        state.chatHistory.push({ role: "user", content: queryText });
        state.chatHistory.push({ role: "assistant", content: data.reply });

        if (data.venues && data.venues.length > 0) {
          plotVenuesOnMap(data.venues, true);
          if (state.activeView === "inicio") {
            displayVenuesCards(data.venues, `Resultados para: "${queryText}"`);
          }
        }
      } else {
        appendChatBubble("bot", "Disculpá, no pude procesar la consulta en este momento.");
      }
    } catch (err) {
      thinkingBubble.remove();
      console.error("Chat error:", err);
      appendChatBubble("bot", "Hubo un problema de conexión con el servidor de GastronomIA.");
    } finally {
      state.isWaitingResponse = false;
    }
  }

  function appendChatBubble(role, text) {
    const row = document.createElement("div");
    row.className = `chat-bubble-row ${role === 'user' ? 'user-row' : 'bot-row'}`;

    if (role === "user") {
      row.innerHTML = `<div class="chat-bubble-content user-bubble">${escapeHtml(text)}</div>`;
    } else {
      row.innerHTML = `
        <div class="chat-bubble-avatar">
          <img src="/static/foody_mascot.png" alt="Foody" />
        </div>
        <div class="chat-bubble-content bot-bubble">
          ${formatMarkdownReply(text)}
        </div>
      `;
    }

    chatFullMessages.appendChild(row);
    chatFullMessages.scrollTop = chatFullMessages.scrollHeight;
    return row;
  }

  function formatMarkdownReply(markdown) {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)\n/g, '<h4 style="margin: 0.4rem 0; color: #1a73e8;">$1</h4>')
      .replace(/> (.*?)\n/g, '<blockquote style="border-left: 3px solid #fbbc04; background: #fef7e0; padding: 0.5rem 0.75rem; margin: 0.5rem 0; border-radius: 4px; font-size: 0.85rem;">$1</blockquote>')
      .replace(/\n/g, '<br/>');
  }

  /* ==========================================================================
     9. EVENT LISTENERS SETUP
     ========================================================================== */
  function setupEventListeners() {
    // Topbar search form
    globalSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = globalSearchInput.value.trim();
      if (val) submitQuery(val, false);
    });

    // Hero prompt form
    heroPromptForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = heroInput.value.trim();
      if (val) {
        submitQuery(val, false);
        heroInput.value = "";
      }
    });

    // View 2 (Full Chat) form
    chatFullForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = chatFullInput.value.trim();
      if (val) {
        submitQuery(val, true);
        chatFullInput.value = "";
      }
    });

    // Quick chips in chat
    document.addEventListener("click", (e) => {
      const chip = e.target.closest(".quick-chip");
      if (chip) {
        const prompt = chip.getAttribute("data-prompt");
        if (prompt) submitQuery(prompt, true);
      }
    });

    // Clear chat
    btnClearChat.addEventListener("click", () => {
      state.chatHistory = [];
      chatFullMessages.innerHTML = `
        <div class="chat-bubble-row bot-row">
          <div class="chat-bubble-avatar">
            <img src="/static/foody_mascot.png" alt="Foody" />
          </div>
          <div class="chat-bubble-content bot-bubble">
            <p>¡Chat reiniciado! ¿Qué experiencia gastronómica estás buscando hoy?</p>
          </div>
        </div>
      `;
    });

    // Barrio Selects (Inicio & Explorer)
    barrioSelect.addEventListener("change", (e) => {
      if (e.target.value) submitQuery(`Buscame restaurantes en ${e.target.value}`);
    });

    explorerBarrioSelect.addEventListener("change", async (e) => {
      const barrio = e.target.value;
      if (!barrio) {
        loadInitialVenues();
        return;
      }
      try {
        const res = await fetch(`/api/map-points?barrio=${encodeURIComponent(barrio)}`);
        const data = await res.json();
        if (data && data.points) {
          plotOnExplorerMap(data.points, true);
        }
      } catch (err) {
        console.error("Explorer barrio filter error:", err);
      }
    });

    // Recenter explorer map
    btnExplorerRecenter.addEventListener("click", () => {
      if (state.explorerMap) state.explorerMap.setView(CABA_CENTER, 12);
    });

    // Dietary chips (Inicio & Explorer)
    const handleDietToggle = async (chipList, isExplorer = false) => {
      chipList.forEach(chip => {
        chip.addEventListener("click", async () => {
          const diet = chip.getAttribute("data-diet");
          chip.classList.toggle("active");

          const activeDiets = [];
          chipList.forEach(c => {
            if (c.classList.contains("active")) activeDiets.push(c.getAttribute("data-diet"));
          });

          const params = activeDiets.map(d => `${d}=true`).join("&");
          const url = `/api/map-points?${params}`;

          try {
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.points) {
              if (isExplorer) {
                plotOnExplorerMap(data.points, true);
              } else {
                plotVenuesOnMap(data.points, true);
                displayVenuesCards(data.points.slice(0, 15), `Locales con opciones ${activeDiets.join(", ")}`);
              }
            }
          } catch (e) {
            console.error("Dietary filter error:", e);
          }
        });
      });
    };

    handleDietToggle(document.querySelectorAll(".diet-chip"), false);
    handleDietToggle(document.querySelectorAll(".explorer-chip"), true);

    // Category Action Cards
    document.querySelectorAll(".cat-card").forEach(card => {
      card.addEventListener("click", () => {
        const action = card.getAttribute("data-action");
        if (action === "restaurantes") {
          submitQuery("Mostrame los mejores restaurantes y cafés de Buenos Aires");
        } else if (action === "rutas") {
          submitQuery("Armame una ruta gastronómica para recorrer en Buenos Aires con paradas destacadas");
        } else if (action === "turismo") {
          submitQuery("Cuáles son los bodegones y cafés históricos más emblemáticos de CABA?");
        } else if (action === "personalizadas") {
          submitQuery("Recomendame lugares con opciones sin TACC o aptas para celíacos y veganos");
        } else if (action === "destino") {
          barrioSelect.scrollIntoView({ behavior: "smooth" });
          barrioSelect.focus();
        }
      });
    });

    // Explorar por Zona Buttons
    document.querySelectorAll(".zone-thumb-card").forEach(btn => {
      btn.addEventListener("click", () => {
        const zone = btn.getAttribute("data-zone");
        submitQuery(`Explorar la oferta gastronómica destacada en ${zone}`);
      });
    });

    // Drawer Close
    drawerClose.addEventListener("click", () => venueDrawer.classList.add("hidden"));

    // Modal Review Close
    modalReviewClose.addEventListener("click", () => modalReview.classList.add("hidden"));
    btnReviewCancel.addEventListener("click", () => modalReview.classList.add("hidden"));

    // Modal Safety & Stats Handlers
    btnAccessibility.addEventListener("click", () => modalSafety.classList.remove("hidden"));
    modalSafetyClose.addEventListener("click", () => modalSafety.classList.add("hidden"));
    btnSafetyUnderstood.addEventListener("click", () => modalSafety.classList.add("hidden"));

    btnStats.addEventListener("click", () => {
      loadStats();
      modalStats.classList.remove("hidden");
    });
    modalStatsClose.addEventListener("click", () => modalStats.classList.add("hidden"));
    btnStatsClose.addEventListener("click", () => modalStats.classList.add("hidden"));

    // Backdrop click
    window.addEventListener("click", (e) => {
      if (e.target === modalSafety) modalSafety.classList.add("hidden");
      if (e.target === modalStats) modalStats.classList.add("hidden");
      if (e.target === modalReview) modalReview.classList.add("hidden");
    });
  }

  // Safe HTML Escaper
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
