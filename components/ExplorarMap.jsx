'use client';

import React, { useEffect, useRef } from 'react';

export default function ExplorarMap({ venues = [], onOpenVenue }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      window.L = L;

      // Cargar Leaflet MarkerCluster dinámicamente en el cliente
      try {
        await import('leaflet.markercluster');
      } catch (err) {
        console.warn('Leaflet MarkerCluster no disponible, usando LayerGroup estándar:', err);
      }

      // Inicializar el mapa si aún no existe
      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-34.6037, -58.3816],
          zoom: 12,
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
        markersBatch.push(marker);
      });

      // Añadir marcadores al grupo de clusters de forma masiva y optimizada
      if (typeof markersLayer.addLayers === 'function') {
        markersLayer.addLayers(markersBatch);
      } else {
        markersBatch.forEach(m => markersLayer.addLayer(m));
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
  }, [venues, onOpenVenue]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-34.6037, -58.3816], 12);
      mapInstanceRef.current.invalidateSize();
    }
  };

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] md:h-[520px] rounded-3xl overflow-hidden shadow-card border border-[#E8E6DF] dark:border-neutral-800">
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
