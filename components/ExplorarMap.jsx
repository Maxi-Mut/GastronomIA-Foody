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

      // Ensure container isn't already initialized
      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-34.6037, -58.3816],
          zoom: 12,
          scrollWheelZoom: true,
        });

        // Mosaico 100% abierto y libre de OpenStreetMap (sin API Key requerida ni marcas de agua)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      }

      if (!isMounted || !mapInstanceRef.current || !markersLayerRef.current) return;

      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      const validVenues = venues.filter(v => v.latitud && v.longitud);

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
              border: 2px solid #ffffff;
            ">
              <span style="transform: rotate(45deg); font-size: 15px;">${symbol}</span>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -34]
        });

        const marker = L.marker([venue.latitud, venue.longitud], { icon: customIcon });

        const popupContent = document.createElement('div');
        popupContent.className = 'map-popup-card';
        popupContent.style.minWidth = '220px';
        popupContent.innerHTML = `
          <div style="padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; background: #133829; color: white; padding: 2px 7px; border-radius: 999px;">
                ${venue.categoria || 'Gastronomía'}
              </span>
              <span style="font-size: 11px; font-weight: 800; color: #D4AF37;">
                ${venue.rango_precio || '$$'}
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 800; margin: 4px 0 2px 0; color: #111;">
              ${venue.nombre}
            </h4>
            <p style="font-size: 11px; color: #666; margin: 0 0 6px 0;">
              📍 ${venue.direccion}, ${venue.barrio}
            </p>
            <p style="font-size: 11px; color: #333; margin: 0 0 8px 0; line-height: 1.3;">
              ${venue.por_que_recomendamos ? venue.por_que_recomendamos.slice(0, 95) + '...' : ''}
            </p>
            <button id="btn-popup-venue-${venue.id}" style="
              width: 100%;
              background: #133829;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 6px 10px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              Ver Ficha Completa →
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-popup-venue-${venue.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onOpenVenue) onOpenVenue(venue);
            };
          }
        });

        marker.addTo(markersLayer);
      });

      // Fit bounds if we have valid points
      if (validVenues.length > 0) {
        const bounds = L.latLngBounds(validVenues.map(v => [v.latitud, v.longitud]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
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
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden shadow-card border border-[#E8E6DF] dark:border-neutral-800">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Botón flotante para recentrar mapa */}
      <button
        onClick={handleRecenter}
        className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-[#1E2320]/95 backdrop-blur-md text-[#133829] dark:text-emerald-400 font-bold text-xs shadow-md border border-neutral-200 dark:border-neutral-700 hover:bg-white transition-all flex items-center space-x-1.5"
        title="Recentrar mapa en CABA"
      >
        <span>📍 Recentrar CABA</span>
      </button>

      {/* Leyenda de pines en el mapa */}
      <div className="absolute bottom-4 left-4 z-20 px-3 py-2 rounded-2xl bg-white/95 dark:bg-[#1E2320]/95 backdrop-blur-md shadow-md border border-neutral-200 dark:border-neutral-700 flex items-center space-x-3 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
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
