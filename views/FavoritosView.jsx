'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, MapPin, ChevronRight, Phone } from 'lucide-react';

export default function FavoritosView({ favorites = [], venues = [], onOpenVenue, onToggleFavorite }) {
  const favoriteVenues = venues.filter(v => favorites.includes(v.id));

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-6 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold font-display text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>Mis Lugares Favoritos ({favoriteVenues.length})</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Tus establecimientos preferidos guardados para acceder rápidamente a su contacto y ubicación.
          </p>
        </div>
      </div>

      {favoriteVenues.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#1E2320] rounded-3xl border border-[#E8E6DF] dark:border-neutral-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto text-2xl">
            🤍
          </div>
          <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-100">
            Aún no guardaste lugares favoritos
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Hacé clic en el corazón en cualquier tarjeta o ficha de restaurante para guardarlo acá.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favoriteVenues.map((venue) => (
            <div
              key={venue.id}
              className="group bg-white dark:bg-[#1E2320] rounded-3xl overflow-hidden border border-[#E8E6DF] dark:border-neutral-800 shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div className="relative h-44 w-full bg-neutral-100 cursor-pointer" onClick={() => onOpenVenue(venue)}>
                <Image
                  src={venue.imagen_url || '/zone_caba.jpg'}
                  alt={venue.nombre}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#133829] text-white">
                    {venue.categoria}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#133829]">
                    {venue.rango_precio}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(venue);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-all"
                  title="Quitar de favoritos"
                >
                  <Heart className="w-4 h-4 fill-white" />
                </button>
                <div className="absolute bottom-2 left-3 text-white text-xs font-semibold drop-shadow">
                  {venue.zona}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => onOpenVenue(venue)}
                    className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-snug cursor-pointer group-hover:text-[#133829] dark:group-hover:text-emerald-400 transition-colors"
                  >
                    {venue.nombre}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{venue.direccion}, {venue.barrio}</span>
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2">
                    {venue.por_que_recomendamos || venue.descripcion}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  {venue.telefono ? (
                    <a
                      href={`tel:${venue.telefono.replace(/[^\d+]/g, '')}`}
                      className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{venue.telefono}</span>
                    </a>
                  ) : <span className="text-neutral-400 text-[11px]">Sin teléfono</span>}

                  <button
                    onClick={() => onOpenVenue(venue)}
                    className="font-bold text-[#133829] dark:text-emerald-400 hover:underline flex items-center space-x-0.5"
                  >
                    <span>Ver Ficha</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
