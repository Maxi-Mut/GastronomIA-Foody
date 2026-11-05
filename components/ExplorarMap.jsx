'use client';

import React, { useEffect, useRef, useCallback } from 'react';

export default function ExplorarMap({ venues = [], onOpenVenue, focusedVenue = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markersByIdRef = useRef(new Map());
  const highlightMarkerRef = useRef(null);

  // Función dedicada para enfocar, resaltar y abrir popup de un local específico
  const applyFocusedVenue = useCallback((venue) => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current || (typeof window !== 'undefined' ? window.L : null);

    // Si ya había un marcador de destaque, removerlo
    if (highlightMarkerRef.current && map) {
      try {
        map.removeLayer(highlightMarkerRef.current);
      } catch (e) {}
      highlightMarkerRef.current = null;
    }

    if (!venue || !venue.latitud || !venue.longitud || !map || !L) return;

    const lat = Number(venue.latitud);
    const lng = Number(venue.longitud);
    if (isNaN(lat) || isNaN(lng)) return;

    // Crear icono prominente con pulso animado, borde dorado y etiqueta del local
    const highlightIcon = L.divIcon({
      className: 'focused-venue-highlight-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto;">
          <!-- Ondas de pulso radiantes doradas -->
          <div style="
            position: absolute;
            top: 2px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(212, 175, 55, 0.45);
            animation: foody-radar 1.8s infinite ease-out;
            pointer-events: none;
          "></div>

          <!-- Píldora distintiva del local -->
          <div style="
            position: relative;
            z-index: 20;
            display: flex;
            align-items: center;
            gap: 6px;
            background: #133829;
            color: #ffffff;
            padding: 6px 14px;
            border-radius: 9999px;
            border: 2px solid #D4AF37;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            letter-spacing: -0.2px;
          ">
            <span style="font-size: 13px;">📍</span>
            <span>${venue.nombre}</span>
          </div>

          <!-- Flecha indicadora apuntando a la coordenada exacta -->
          <div style="
            width: 10px;
            height: 10px;
            background: #133829;
            transform: rotate(45deg);
            margin-top: -5px;
            border-right: 2px solid #D4AF37;
            border-bottom: 2px solid #D4AF37;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.25);
            z-index: 19;
          "></div>
        </div>
      `,
      iconSize: [180, 44],
      iconAnchor: [90, 44],
      popupAnchor: [0, -44]
    });

    // Contenido enriquecido del popup
    const popupContent = document.createElement('div');
    popupContent.className = 'p-1 font-sans';
    popupContent.innerHTML = `
      <div style="font-family: inherit; min-width: 210px; max-width: 250px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 6px;">
          <span style="background: #133829; color: #D4AF37; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Local Seleccionado
          </span>
          <span style="background: #fdf6e7; color: #8f6409; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">
            ${venue.rango_precio || '$$'}
          </span>
        </div>
        <div style="font-weight: 800; font-size: 15px; color: #133829; line-height: 1.2; margin-bottom: 3px;">
          ${venue.nombre}
        </div>
        <div style="font-size: 11px; color: #555; margin-bottom: 6px; line-height: 1.3;">
          📍 ${venue.direccion ? `${venue.direccion}, ` : ''}${venue.barrio || ''} ${venue.zona ? `(${venue.zona})` : ''}
        </div>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
          <span style="background: #eef5f1; color: #133829; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px;">
            ${venue.cocina || venue.categoria}
          </span>
        </div>
        <button id="btn-highlight-venue-${venue.id}" style="
          width: 100%;
          background: #133829;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        ">
          <span>Ver Ficha Completa</span>
          <span>&rarr;</span>
        </button>
      </div>
    `;

    const btn = popupContent.querySelector(`#btn-highlight-venue-${venue.id}`);
    if (btn) {
      btn.addEventListener('click', () => {
        if (onOpenVenue) onOpenVenue(venue);
      });
    }

    // Agregar directamente a map (nunca al cluster para que SIEMPRE sea visible e interactivo)
    const highlightMarker = L.marker([lat, lng], {
      icon: highlightIcon,
      zIndexOffset: 10000
    }).addTo(map);

    highlightMarker.bindPopup(popupContent, {
      autoPan: true,
      autoPanPadding: [40, 40],
      closeButton: true
    });

    highlightMarkerRef.current = highlightMarker;

    // Volar de manera suave y fluida a zoom 17 centrado en el punto
    map.flyTo([lat, lng], 17, {
      duration: 1.0,
      easeLinearity: 0.25
    });

    // Abrir popup automáticamente al posicionar
    const timer = setTimeout(() => {
      try {
        highlightMarker.openPopup();
      } catch (e) {}
    }, 450);

    return () => clearTimeout(timer);
  }, [onOpenVenue]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      window.L = L;
      leafletRef.current = L;

      // Cargar Leaflet MarkerCluster dinámicamente en el cliente
      try {
        await import('leaflet.markercluster');
      } catch (err) {
        console.warn('Leaflet MarkerCluster no disponible, usando LayerGroup estándar:', err);
      }

      // Inicializar el mapa si aún no existe
      if (!mapInstanceRef.current && mapContainerRef.current) {
        const initialCenter = (focusedVenue && focusedVenue.latitud && focusedVenue.longitud)
          ? [Number(focusedVenue.latitud), Number(focusedVenue.longitud)]
          : [-34.6037, -58.3816];
        const initialZoom = (focusedVenue && focusedVenue.latitud) ? 17 : 12;

        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          scrollWheelZoom: true,
        });

        // Mosaico abierto y libre de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        // Crear grupo de clusters interactivo (círculos con contador y zoom progresivo)
        let clusterLayer;
        if (typeof L.markerClusterGroup === 'function') {
          clusterLayer = L.markerClusterGroup({
            maxClusterRadius: 45,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            chunkedLoading: true,
            removeOutsideVisibleBounds: true,
            animate: true
          });
        } else {
          clusterLayer = L.layerGroup();
        }

        map.addLayer(clusterLayer);
        markersLayerRef.current = clusterLayer;
        mapInstanceRef.current = map;

        // Auto invalidate size on resize
        window.addEventListener('resize', () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
      }

      if (!isMounted || !mapInstanceRef.current || !markersLayerRef.current) return;

      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();
      markersByIdRef.current.clear();

      const validVenues = venues.filter(v => v.latitud && v.longitud);
      const markersBatch = [];

      validVenues.forEach((venue) => {
        // Determinación de color e icono según categoría y restricciones
        let iconBg = '#133829';
        let symbol = '🍴';

        if (venue.restricciones && venue.restricciones.some(r => r.codigo === 'sin_tacc')) {
          iconBg = '#059669'; // Emerald
          symbol = '🌾';
        } else if (venue.categoria === 'Parrilla') {
          iconBg = '#B91C1C'; // Red
          symbol = '🥩';
        } else if (venue.categoria === 'Pizzería') {
          iconBg = '#D97706'; // Amber
          symbol = '🍕';
        } else if (venue.categoria === 'Cafetería') {
          iconBg = '#78350F'; // Coffee Brown
          symbol = '☕';
        } else if (venue.categoria === 'Bodegón') {
          iconBg = '#4338CA'; // Indigo
          symbol = '🍷';
        }

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              background-color: ${iconBg};
              color: white;
              width: 34px;
              height: 34px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              border: 2px solid white;
              cursor: pointer;
            ">
              <span style="transform: rotate(45deg); font-size: 14px; line-height: 1;">${symbol}</span>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -34],
        });

        const marker = L.marker([venue.latitud, venue.longitud], { icon: customIcon });

        // Popup interactivo
        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 font-sans';
        popupContent.innerHTML = `
          <div style="font-family: inherit; max-width: 210px;">
            <div style="font-weight: 800; font-size: 14px; color: #133829; margin-bottom: 2px;">
              ${venue.nombre}
            </div>
            <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
              📍 ${venue.barrio || ''} ${venue.zona ? `(${venue.zona})` : ''}
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
              <span style="background: #eef5f1; color: #133829; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px;">
                ${venue.cocina || venue.categoria}
              </span>
              <span style="background: #fdf6e7; color: #8f6409; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px;">
                ${venue.rango_precio}
              </span>
            </div>
            <button id="btn-venue-${venue.id}" style="
              width: 100%;
              background: #133829;
              color: white;
              border: none;
              padding: 6px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              Ver Ficha Completa
            </button>
          </div>
        `;

        const btn = popupContent.querySelector(`#btn-venue-${venue.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            if (onOpenVenue) onOpenVenue(venue);
          });
        }

        marker.bindPopup(popupContent);
        markersByIdRef.current.set(String(venue.id), marker);
        markersByIdRef.current.set(Number(venue.id), marker);
        markersBatch.push(marker);
      });

      // Añadir marcadores al grupo de clusters de forma masiva y optimizada
      if (typeof markersLayer.addLayers === 'function') {
        markersLayer.addLayers(markersBatch);
      } else {
        markersBatch.forEach(m => markersLayer.addLayer(m));
      }

      // Si hay un local enfocado en el momento de inicializar, aplicar destaque inmediatamente
      if (focusedVenue) {
        applyFocusedVenue(focusedVenue);
      }

      // Asegurar redimensionado
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 200);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore cleanup race condition
        }
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [venues, onOpenVenue, focusedVenue, applyFocusedVenue]);

  // Efecto dinámico al cambiar o recibir un nuevo focusedVenue
  useEffect(() => {
    if (focusedVenue) {
      applyFocusedVenue(focusedVenue);
    } else if (highlightMarkerRef.current && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.removeLayer(highlightMarkerRef.current);
      } catch (e) {}
      highlightMarkerRef.current = null;
    }
  }, [focusedVenue, applyFocusedVenue]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-34.6037, -58.3816], 12);
      mapInstanceRef.current.invalidateSize();
    }
  };

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] md:h-[520px] rounded-3xl overflow-hidden shadow-card border border-[#E8E6DF] dark:border-neutral-800">
      <style>{`
        @keyframes foody-radar {
          0% { transform: scale(0.6); opacity: 0.9; }
          50% { transform: scale(1.4); opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .focused-venue-highlight-marker {
          overflow: visible !important;
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Botón flotante para recentrar mapa */}
      <button
        onClick={handleRecenter}
        className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/95 dark:bg-[#1E2320]/95 backdrop-blur-md text-[#133829] dark:text-emerald-400 font-bold text-xs shadow-md border border-neutral-200 dark:border-neutral-700 hover:bg-white transition-all flex items-center space-x-1.5"
        title="Recentrar mapa en CABA"
      >
        <span>📍 Recentrar</span>
      </button>

      {/* Leyenda de pines en el mapa */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#1E2320]/95 backdrop-blur-md shadow-md border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center gap-2 sm:space-x-3 text-[10px] sm:text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 max-w-[85%]">
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <span>Sin TACC</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
          <span>Parrilla</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>Pizzería</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#133829] inline-block" />
          <span>Restó</span>
        </span>
      </div>
    </div>
  );
}
