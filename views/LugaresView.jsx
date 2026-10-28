'use client';

import React from 'react';
import Image from 'next/image';
import { Bookmark, MapPin, ChevronRight, Plus, Route, Calendar } from 'lucide-react';

export default function LugaresView({ onOpenVenue, venues = [] }) {
  // Saved routes and visited experiences
  const SAMPLE_ROUTES = [
    {
      id: 1,
      title: 'Circuito Bodegones Históricos',
      zone: 'CABA (San Telmo y La Boca)',
      stops: ['El Obrero', 'Pizzería Güerrin'],
      description: 'Recorrido porteño clásico con porciones abundantes y mística tradicional.',
      date: 'Mayo 2026'
    },
    {
      id: 2,
      title: 'Ruta 100% Sin Gluten & Saludable',
      zone: 'Palermo y Belgrano',
      stops: ['Sintaxis Sin TACC', 'Buenos Aires Verde', 'Cuervo Café'],
      description: 'Experiencia gastronómica segura con certificación celíaca y propuesta vegetal.',
      date: 'Abril 2026'
    }
  ];

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-6 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold font-display text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-[#133829] dark:text-emerald-400" />
            <span>Mis Lugares y Rutas Gastronómicas</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Organizá tus salidas, guardá itinerarios personalizados y llevá el registro de tus visitas.
          </p>
        </div>

        <button
          onClick={() => alert('¡Función de crear nueva ruta activada! Podés pedirle a Foody en el chat que te arme un itinerario a medida.')}
          className="px-4 py-2 rounded-2xl bg-[#133829] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm hover:bg-[#1a4a37] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Ruta</span>
        </button>
      </div>

      {/* Rutas Guardadas */}
      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-wider font-extrabold text-neutral-400 px-1">
          Rutas Guardadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_ROUTES.map((route) => (
            <div
              key={route.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#1E2320] border border-[#E8E6DF] dark:border-neutral-800 shadow-soft hover:shadow-card transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                  <Route className="w-3 h-3" />
                  <span>{route.zone}</span>
                </span>
                <span className="text-[11px] text-neutral-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{route.date}</span>
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">{route.title}</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">{route.description}</p>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-400 block mb-1.5">Paradas del itinerario:</span>
                <div className="flex flex-wrap gap-1.5">
                  {route.stops.map((stop, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-[#F8F7F2] dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      📍 {stop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lugares Recientemente Explorados */}
      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-wider font-extrabold text-neutral-400 px-1">
          Sugeridos para tu próxima salida
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {venues.slice(0, 3).map((v) => (
            <div
              key={v.id}
              onClick={() => onOpenVenue(v)}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#1E2320] border border-[#E8E6DF] dark:border-neutral-800 shadow-soft cursor-pointer hover:border-[#133829]/50 transition-all flex items-center space-x-3"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <Image src={v.imagen_url || '/zone_caba.jpg'} alt={v.nombre} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">{v.nombre}</h5>
                <span className="text-[11px] text-neutral-400 block truncate">{v.barrio}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
