/**
 * GastronomIA — Frontend Interactive Engine
 * Integrates Leaflet Maps, Real-time Chat, Food Safety Protocols & Filters
 */

document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    map: null,
    markersLayer: null,
    activeVenues: [],
    selectedBarrio: "",
    activeDietaryFilters: new Set(),
    chatHistory: [],
    isWaitingResponse: false
  };

  // DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const barrioSelect = document.getElementById("barrio-select");
  const markersCountBadge = document.getElementById("markers-count");
  const btnRecenter = document.getElementById("btn-recenter");
  const venueDrawer = document.getElementById("venue-drawer");
  const drawerClose = document.getElementById("drawer-close");
  
  // Modals & Banners
  const btnSafetyInfo = document.getElementById("btn-safety-info");
  const modalSafety = document.getElementById("modal-safety");
  const modalSafetyClose = document.getElementById("modal-safety-close");
  const btnSafetyUnderstood = document.getElementById("btn-safety-understood");
  const safetyBanner = document.getElementById("safety-banner");
  const bannerDismiss = document.getElementById("banner-dismiss");

  const btnStats = document.getElementById("btn-stats");
  const modalStats = document.getElementById("modal-stats");
  const modalStatsClose = document.getElementById("modal-stats-close");
  const btnStatsClose = document.getElementById("btn-stats-close");

  // Mobile View Toggles
  const btnToggleChat = document.getElementById("btn-toggle-chat");
  const btnToggleMap = document.getElementById("btn-toggle-map");

  // Initialize Application
  initMap();
  loadBarrios();
  loadStats();
  setupEventListeners();
  loadInitialVenues();

  /**
   * 1. Initialize Interactive Leaflet Map
   */
  function initMap() {
    // Center of CABA (Obelisco default)
    const CABA_CENTER = [-34.6037, -58.3816];
    
    state.map = L.map("map", {
      zoomControl: true,
      attributionControl: true
    }).setView(CABA_CENTER, 12);

    // OpenStreetMap oficial (100% libre, sin marcas de agua, sin API Key)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(state.map);

    // MarkerClusterGroup para agrupar fluidamente los 8.181 establecimientos
    if (typeof L.markerClusterGroup === "function") {
      state.markersCluster = L.markerClusterGroup({
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        chunkedLoading: true
      });
      state.map.addLayer(state.markersCluster);
    } else {
      state.markersLayer = L.layerGroup().addTo(state.map);
    }
  }

  /**
   * 2. Create custom Pin Icons based on dietary features
   */
  function createCustomPin(venue) {
    let pinColor = "#f59e0b"; // Default gastronomic amber
    let pinEmoji = "🍽️";

    if (venue.es_sin_tacc && venue.es_sin_tacc.startsWith("Apto")) {
      pinColor = "#eab308";
      pinEmoji = "🌾";
    } else if (venue.es_vegano && venue.es_vegano.startsWith("Apto")) {
      pinColor = "#10b981";
      pinEmoji = "🌱";
    } else if (venue.tipo_categoria === "Cafetería") {
      pinEmoji = "☕";
    } else if (venue.tipo_categoria === "Bar / Pub") {
      pinEmoji = "🍺";
    }

    const html = `
      <div style="
        background: ${pinColor};
        color: #111827;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        border: 2px solid #ffffff;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${pinEmoji}
      </div>
    `;

    return L.divIcon({
      html: html,
      className: "custom-div-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  /**
   * 3. Render Venues on Map
   */
  function plotVenuesOnMap(venues, shouldFitBounds = true) {
    if (state.markersCluster) {
      state.markersCluster.clearLayers();
    } else if (state.markersLayer) {
      state.markersLayer.clearLayers();
    }

    state.activeVenues = venues;

    if (!venues || venues.length === 0) {
      markersCountBadge.textContent = "0 locales en mapa";
      return;
    }

    markersCountBadge.textContent = `${Number(venues.length).toLocaleString("es-AR")} locales en mapa`;
    const bounds = L.latLngBounds();
    const markerBatch = [];

    venues.forEach(v => {
      if (!v.latitud || !v.longitud) return;

      const latLng = [v.latitud, v.longitud];
      bounds.extend(latLng);

      const marker = L.marker(latLng, { icon: createCustomPin(v) });

      // Build popup content
      let badgesHtml = "";
      if (v.es_sin_tacc && v.es_sin_tacc.startsWith("Apto")) {
        badgesHtml += `<span class="badge-diet badge-sin-tacc">🌾 Sin TACC</span> `;
      }
      if (v.es_vegano && v.es_vegano.startsWith("Apto")) {
        badgesHtml += `<span class="badge-diet badge-vegano">🌱 Vegano</span> `;
      }
      if (v.es_vegetariano && v.es_vegetariano.startsWith("Apto")) {
        badgesHtml += `<span class="badge-diet badge-veggie">🥗 Vegetariano</span> `;
      }

  function formatWebsiteUrl(rawUrl) {
    if (!rawUrl) return null;
    let url = rawUrl.trim();
    if (url.includes("fayer.com/bsas")) return "https://fayer.com/";
    if (url.includes("@") && !url.startsWith("http")) return `mailto:${url}`;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
      url = "https://" + url;
    }
    return url;
  }

      let actionsHtml = "";
      if (v.telefono) {
        actionsHtml += `<a href="tel:${v.telefono.replace(/\s+/g, '')}" class="popup-btn popup-tel" target="_blank">📞 Llamar (${v.telefono})</a>`;
      }
      if (v.website) {
        const cleanWeb = formatWebsiteUrl(v.website);
        actionsHtml += `<a href="${cleanWeb}" class="popup-btn popup-web" target="_blank" rel="noopener noreferrer">🌐 Web / Menú</a>`;
      }

      const popupContent = `
        <div style="min-width: 200px;">
          <div class="popup-title">${escapeHtml(v.nombre)}</div>
          <div class="popup-category">${escapeHtml(v.tipo_categoria || v.tipo_establecimiento || 'Gastronomía')} &bull; ${escapeHtml(v.cocina || 'Variada')}</div>
          <div class="popup-address">📍 ${escapeHtml(v.direccion || 'Ubicación en mapa')}, ${escapeHtml(v.barrio_localidad)}</div>
          ${badgesHtml ? `<div class="popup-badges">${badgesHtml}</div>` : ''}
          ${actionsHtml ? `<div class="popup-actions">${actionsHtml}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, { className: "custom-leaflet-popup" });

      marker.on("click", () => {
        showVenueDrawer(v);
      });

      markerBatch.push(marker);
    });

    if (state.markersCluster) {
      state.markersCluster.addLayers(markerBatch);
    } else if (state.markersLayer) {
      markerBatch.forEach(m => state.markersLayer.addLayer(m));
    }

    if (shouldFitBounds && bounds.isValid()) {
      state.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }

  /**
   * 4. Show Details Drawer on Map
   */
  function showVenueDrawer(venue) {
    document.getElementById("drawer-title").textContent = venue.nombre;
    document.getElementById("drawer-tag").textContent = venue.tipo_categoria || venue.tipo_establecimiento || "Gastronomía";
    document.getElementById("drawer-cuisine").textContent = `Cocina: ${venue.cocina || 'Variada'}`;
    document.getElementById("drawer-address").textContent = `📍 ${venue.direccion || 'Sin dirección exacta'}, ${venue.barrio_localidad}`;
    document.getElementById("drawer-source").textContent = `Fuente de datos: ${venue.fuente_dato}`;

    // Dietary badges
    const dietContainer = document.getElementById("drawer-dietary");
    dietContainer.innerHTML = "";
    
    if (venue.es_sin_tacc && venue.es_sin_tacc.startsWith("Apto")) {
      dietContainer.innerHTML += `<span class="badge-diet badge-sin-tacc">🌾 Sin TACC (Verificar con local)</span>`;
    }
    if (venue.es_vegano && venue.es_vegano.startsWith("Apto")) {
      dietContainer.innerHTML += `<span class="badge-diet badge-vegano">🌱 Vegano</span>`;
    }
    if (venue.es_vegetariano && venue.es_vegetariano.startsWith("Apto")) {
      dietContainer.innerHTML += `<span class="badge-diet badge-veggie">🥗 Vegetariano</span>`;
    }

    // Direct actions
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
      webBtn.href = venue.website;
      webBtn.style.display = "inline-flex";
    } else {
      webBtn.style.display = "none";
    }

    venueDrawer.classList.remove("hidden");
  }

  /**
   * 5. Load Initial Venues on Map (Full 8.181 venues with clustering)
   */
  async function loadInitialVenues() {
    markersCountBadge.textContent = "Cargando 8.181 locales...";
    try {
      const res = await fetch("/api/map-points");
      const data = await res.json();
      if (data && data.points) {
        plotVenuesOnMap(data.points, false);
        markersCountBadge.textContent = `${Number(data.total).toLocaleString("es-AR")} locales en mapa`;
      }
    } catch (e) {
      console.warn("Could not load all map points:", e);
    }
  }

  /**
   * 6. Load Barrios Dropdown from Backend
   */
  async function loadBarrios() {
    try {
      const res = await fetch("/api/barrios");
      const barrios = await res.json();
      
      barrios.forEach(b => {
        if (!b.nombre || b.nombre.includes("CABA / GBA") || b.nombre === "No especificado") return;
        const opt = document.createElement("option");
        opt.value = b.nombre;
        opt.textContent = `${b.nombre} (${b.count})`;
        barrioSelect.appendChild(opt);
      });
    } catch (e) {
      console.error("Error loading barrios:", e);
    }
  }

  /**
   * 7. Load Stats Dashboard
   */
  async function loadStats() {
    try {
      const res = await fetch("/api/stats");
      const s = await res.json();

      document.getElementById("stat-total").textContent = Number(s.total_establecimientos).toLocaleString("es-AR");
      document.getElementById("stat-barrios").textContent = `${s.total_barrios}+`;
      document.getElementById("stat-contact").textContent = Number(s.con_telefono).toLocaleString("es-AR");
      document.getElementById("stat-sin-tacc").textContent = s.apto_sin_tacc;
      document.getElementById("stat-vegano").textContent = s.apto_vegano;
    } catch (e) {
      console.error("Error loading stats:", e);
    }
  }

  /**
   * 8. Event Listeners Setup
   */
  function setupEventListeners() {
    // Chat Submit
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleUserMessage();
    });

    // Suggestion Buttons click
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".suggestion-btn");
      if (btn) {
        const query = btn.getAttribute("data-query");
        if (query) {
          userInput.value = query;
          handleUserMessage();
        }
      }
    });

    // Barrio Select Change
    barrioSelect.addEventListener("change", (e) => {
      state.selectedBarrio = e.target.value;
      triggerSearchFromFilters();
    });

    // Dietary Chip Filters
    const chips = document.querySelectorAll(".chip-filter");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const diet = chip.getAttribute("data-diet");
        if (state.activeDietaryFilters.has(diet)) {
          state.activeDietaryFilters.delete(diet);
          chip.classList.remove("active");
        } else {
          state.activeDietaryFilters.add(diet);
          chip.classList.add("active");
        }
        triggerSearchFromFilters();
      });
    });

    // Drawer Close
    drawerClose.addEventListener("click", () => {
      venueDrawer.classList.add("hidden");
    });

    // Recenter button
    btnRecenter.addEventListener("click", () => {
      if (state.activeVenues.length < 500) {
        loadInitialVenues();
        state.map.setView([-34.6037, -58.3816], 12);
      } else if (state.activeVenues && state.activeVenues.length > 0) {
        const bounds = L.latLngBounds(state.activeVenues.map(v => [v.latitud, v.longitud]));
        state.map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        state.map.setView([-34.6037, -58.3816], 12);
      }
    });

    // Banner Dismiss
    bannerDismiss.addEventListener("click", () => {
      safetyBanner.style.display = "none";
    });

    // Modals Handlers
    btnSafetyInfo.addEventListener("click", () => modalSafety.classList.remove("hidden"));
    modalSafetyClose.addEventListener("click", () => modalSafety.classList.add("hidden"));
    btnSafetyUnderstood.addEventListener("click", () => modalSafety.classList.add("hidden"));

    btnStats.addEventListener("click", () => {
      loadStats();
      modalStats.classList.remove("hidden");
    });
    modalStatsClose.addEventListener("click", () => modalStats.classList.add("hidden"));
    btnStatsClose.addEventListener("click", () => modalStats.classList.add("hidden"));

    // Close modal on click outside
    window.addEventListener("click", (e) => {
      if (e.target === modalSafety) modalSafety.classList.add("hidden");
      if (e.target === modalStats) modalStats.classList.add("hidden");
    });

    // Mobile View Toggle
    btnToggleChat.addEventListener("click", () => {
      document.body.classList.remove("show-map");
      btnToggleChat.classList.add("active");
      btnToggleMap.classList.remove("active");
    });

    btnToggleMap.addEventListener("click", () => {
      document.body.classList.add("show-map");
      btnToggleMap.classList.add("active");
      btnToggleChat.classList.remove("active");
      setTimeout(() => state.map.invalidateSize(), 200);
    });
  }

  /**
   * 9. Trigger Search When Filter Controls are Used
   */
  async function triggerSearchFromFilters() {
    const params = [];
    if (state.selectedBarrio) params.push(`barrio=${encodeURIComponent(state.selectedBarrio)}`);
    if (state.activeDietaryFilters.has("sin_tacc")) params.push(`sin_tacc=true`);
    if (state.activeDietaryFilters.has("vegano")) params.push(`vegano=true`);
    if (state.activeDietaryFilters.has("vegetariano")) params.push(`vegetariano=true`);

    const url = `/api/map-points?` + params.join("&");
    markersCountBadge.textContent = "Filtrando...";
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.points) {
        plotVenuesOnMap(data.points, true);
        markersCountBadge.textContent = `${Number(data.total).toLocaleString("es-AR")} locales en mapa`;
      }
    } catch (e) {
      console.error("Filter search error:", e);
    }
  }

  /**
   * 10. Handle User Message in Chat
   */
  async function handleUserMessage() {
    const message = userInput.value.trim();
    if (!message || state.isWaitingResponse) return;

    // Append User Bubble
    appendUserBubble(message);
    userInput.value = "";
    sendBtn.disabled = true;
    state.isWaitingResponse = true;

    // Append Typing Indicator
    const typingRow = appendTypingIndicator();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          history: state.chatHistory.slice(-6)
        })
      });

      const data = await res.json();
      typingRow.remove();

      if (data && data.reply) {
        appendBotBubble(data.reply);
        state.chatHistory.push({ role: "user", content: message });
        state.chatHistory.push({ role: "assistant", content: data.reply });

        // If venues are returned, update map and sync pins
        if (data.venues && data.venues.length > 0) {
          plotVenuesOnMap(data.venues);
        }
      } else {
        appendBotBubble("Disculpá, ocurrió un error procesando tu consulta. Por favor, intentá nuevamente.");
      }
    } catch (err) {
      typingRow.remove();
      console.error("Chat error:", err);
      appendBotBubble("Hubo un inconveniente conectando con el servicio. Verificá que el servidor esté activo.");
    } finally {
      sendBtn.disabled = false;
      state.isWaitingResponse = false;
      userInput.focus();
    }
  }

  /**
   * 11. Chat DOM Utilities
   */
  function appendUserBubble(text) {
    const row = document.createElement("div");
    row.className = "message-row user-row";
    row.innerHTML = `
      <div class="message-bubble user-bubble">
        <p>${escapeHtml(text)}</p>
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendTypingIndicator() {
    const row = document.createElement("div");
    row.className = "message-row bot-row";
    row.innerHTML = `
      <div class="bot-avatar">🤖</div>
      <div class="message-bubble bot-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return row;
  }

  function appendBotBubble(markdownText) {
    const row = document.createElement("div");
    row.className = "message-row bot-row";

    const formattedHtml = parseMarkdown(markdownText);

    row.innerHTML = `
      <div class="bot-avatar">🤖</div>
      <div class="message-bubble bot-bubble">
        <div class="bubble-header">
          <span class="bot-name">GastronomIA</span>
          <span class="time-stamp">Ahora</span>
        </div>
        <div class="bubble-content">
          ${formattedHtml}
        </div>
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * 12. Lightweight Safe Markdown Parser
   */
  function parseMarkdown(md) {
    if (!md) return "";

    let html = escapeHtml(md);

    // Headers (### ...)
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");

    // Blockquotes (> ...)
    html = html.replace(/^\&gt; (.*$)/gim, "<blockquote>$1</blockquote>");

    // Bold (**...**)
    html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

    // Italics (*...*)
    html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

    // Markdown Links [Text](Url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Bullet points (- ...)
    html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    // Paragraph breaks
    html = html.replace(/\n\n+/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");

    return `<p>${html}</p>`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
