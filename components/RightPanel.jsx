'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Heart, ChevronRight, UtensilsCrossed, Sparkles } from 'lucide-react';

const ZONES = [
  { id: 'CABA', name: 'CABA', subtitle: 'Ciudad de Buenos Aires', image: '/zone_caba.jpg' },
  { id: 'Zona Norte (GBA)', name: 'Zona Norte', subtitle: 'GBA', image: '/zone_norte.jpg' },
  { id: 'Zona Sur (GBA)', name: 'Zona Sur', subtitle: 'GBA', image: '/zone_sur.jpg' },
  { id: 'Zona Oeste (GBA)', name: 'Zona Oeste', subtitle: 'GBA', image: '/zone_oeste.jpg' },
];

export default function RightPanel({ onSelectZone, onOpenExperiences, onAskFoodyExperience }) {
  return (
    <aside className="w-80 p-5 space-y-5 shrink-0 overflow-y-auto hidden lg:block border-l border-[#E8E6DF] dark:border-neutral-800 bg-[#FAF9F5] dark:bg-[#151916]">
      {/* 1. Banner Superior: Obelisco al atardecer */}
      <div className="relative h-44 rounded-3xl overflow-hidden shadow-card group cursor-pointer border border-black/5">
        <Image
          src="/zone_caba.jpg"
          alt="Buenos Aires Obelisco"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white/90">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="text-xs uppercase tracking-wider text-amber-300 font-bold">Destino Oficial</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </div>
          <h3 className="font-extrabold text-xl leading-tight font-display text-white drop-shadow-sm">
            Buenos Aires y Gran Buenos Aires
          </h3>
          <p className="text-xs text-neutral-200 mt-1 line-clamp-1">
            Capital Mundial de la Gastronomía Iberoamericana
          </p>
        </div>
      </div>

      {/* 2. Sección "Explorá por zona" */}
      <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-4 shadow-soft border border-[#E8E6DF] dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <div className="flex items-center space-x-2 text-neutral-800 dark:text-neutral-100 font-bold text-sm">
            <span className="text-[#133829] dark:text-emerald-400 text-xs">❖</span>
            <span>Explorá por zona</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {ZONES.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className="group relative h-28 rounded-2xl overflow-hidden text-left shadow-sm border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#133829]"
            >
              <Image
                src={zone.image}
                alt={zone.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-2.5 left-2.5 right-2 text-white">
                <span className="font-bold text-xs block leading-tight text-white group-hover:text-amber-300 transition-colors">
                  {zone.name}
                </span>
                <span className="text-[10px] text-neutral-300 block font-medium">
                  {zone.subtitle}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Sección "Tus experiencias" */}
      <button
        onClick={onOpenExperiences}
        className="w-full text-left bg-white dark:bg-[#1E2320] rounded-3xl p-4 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 hover:border-[#133829]/40 transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-neutral-800 dark:text-neutral-100 font-bold text-sm">
            <span className="text-[#D4AF37]">⭐</span>
            <span>Tus experiencias</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <div className="flex items-center space-x-3 bg-[#FAF8F2] dark:bg-black/20 p-3 rounded-2xl border border-amber-900/5">
          <div className="w-9 h-9 rounded-xl bg-[#133829]/10 dark:bg-white/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-[#133829] dark:text-emerald-400" />
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-snug">
            Guardá tus lugares favoritos y creá tu propio viaje gastronómico.
          </p>
        </div>
      </button>

      {/* 4. Banner Inferior CTA con Foody */}
      <div 
        onClick={onAskFoodyExperience}
        className="relative rounded-3xl overflow-hidden p-5 bg-[#0D2118] text-white shadow-card cursor-pointer group border border-emerald-900/40"
      >
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-emerald-600/10 blur-xl" />
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative w-11 h-11 rounded-full bg-white/10 p-1 shrink-0 ring-1 ring-white/20">
            <Image
              src="/foody_mascot.png"
              alt="Foody"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-[#D4AF37] tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Experiencias Foody</span>
            </span>
            <h4 className="font-bold text-sm text-white leading-tight">
              ¿Listo para vivir una nueva experiencia?
            </h4>
          </div>
        </div>
        <p className="text-xs text-emerald-100/80 mb-3 leading-relaxed">
          Pedile a Foody que te arme un itinerario gastronómico para hoy según tu presupuesto y antojos.
        </p>
        <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#D4AF37] group-hover:underline">
          <span>Crear ruta gastronómica</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </aside>
  );
}
