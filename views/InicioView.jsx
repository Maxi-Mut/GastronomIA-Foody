'use client';

import React from 'react';
import Image from 'next/image';
import { Utensils, Route, Landmark, Sparkles, Navigation, ChevronRight, MapPin, Heart, ShieldAlert } from 'lucide-react';

export default function InicioView({ onQuickPrompt, onOpenVenue, venues = [], favorites = [], onToggleFavorite }) {
  const BENTO_ROW_1 = [
    {
      id: 'restaurantes',
      title: 'Restaurantes y cafés',
      icon: Utensils,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
      prompt: 'Recomendame los mejores restaurantes y cafés de especialidad'
    },
    {
      id: 'rutas',
      title: 'Rutas gastronómicas',
      icon: Route,
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40',
      prompt: 'Armame una ruta gastronómica para recorrer este fin de semana en Buenos Aires'
    },
    {
      id: 'turismo',
      title: 'Turismo gastronómico',
      icon: Landmark,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      prompt: 'Lugares históricos y bodegones emblemáticos para hacer turismo en CABA'
    },
  ];

  const BENTO_ROW_2 = [
    {
      id: 'personalizadas',
      title: 'Recomendaciones personalizadas',
      icon: Sparkles,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
      prompt: 'Recomendaciones gastronómicas personalizadas según mis preferencias'
    },
    {
      id: 'destino',
      title: 'Sugerencias según tu destino',
      icon: Navigation,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
      prompt: '¿Qué comer según mi destino en CABA o GBA hoy?'
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Hero Card: Bienvenida de Foody */}
      <section className="bg-white dark:bg-[#1E2320] rounded-3xl p-5 sm:p-8 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 flex flex-col md:flex-row items-center gap-5 sm:gap-8">
        {/* Ilustración de Foody */}
        <div className="shrink-0 w-36 h-36 sm:w-48 sm:h-48 md:w-52 md:h-52 relative flex items-center justify-center bg-[#FAF8F2] dark:bg-neutral-800/40 rounded-3xl p-3 sm:p-4 border border-amber-900/5">
          <Image
            src="/foody_mascot.png"
            alt="Foody Robot Chef"
            width={180}
            height={180}
            priority
            className="object-contain floating-mascot max-w-full max-h-full"
          />
        </div>

        {/* Textos de Bienvenida */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Asistente Inteligente Activo</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-neutral-900 dark:text-white leading-tight">
            ¡Hola! Soy Foody,<br />
            tu asistente de <span className="text-[#133829] dark:text-emerald-400">GastronomIA</span> <span className="text-[#D4AF37]">✨</span>
          </h1>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-xl">
            Estoy acá para ayudarte a descubrir los mejores sabores y experiencias gastronómicas en Buenos Aires y Gran Buenos Aires.
          </p>

          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100 pt-1">
            ¿En qué puedo ayudarte hoy?
          </p>

          {/* Chips de sugerencias rápidas */}
          <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
            <button
              onClick={() => onQuickPrompt('Opciones con menú sin TACC en Palermo')}
              className="text-xs px-3 py-1.5 rounded-full bg-[#F8F7F2] dark:bg-neutral-800 hover:bg-[#133829] hover:text-white dark:hover:bg-emerald-600 transition-colors border border-neutral-200 dark:border-neutral-700 font-medium"
            >
              🌾 Sin TACC en Palermo
            </button>
            <button
              onClick={() => onQuickPrompt('Mejores bodegones con milanesas gigantes')}
              className="text-xs px-3 py-1.5 rounded-full bg-[#F8F7F2] dark:bg-neutral-800 hover:bg-[#133829] hover:text-white dark:hover:bg-emerald-600 transition-colors border border-neutral-200 dark:border-neutral-700 font-medium"
            >
              🥩 Bodegones clásicos
            </button>
            <button
              onClick={() => onQuickPrompt('Cafetería de especialidad tranquila en Zona Norte')}
              className="text-xs px-3 py-1.5 rounded-full bg-[#F8F7F2] dark:bg-neutral-800 hover:bg-[#133829] hover:text-white dark:hover:bg-emerald-600 transition-colors border border-neutral-200 dark:border-neutral-700 font-medium"
            >
              ☕ Cafés en Zona Norte
            </button>
          </div>
        </div>
      </section>

      {/* 2. Grid de Accesos Rápidos (Bento Grid exacto del diseño) */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-neutral-400 dark:text-neutral-500 px-1">
          Accesos Rápidos
        </h2>

        {/* Fila 1: 3 Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {BENTO_ROW_1.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onQuickPrompt(item.prompt)}
                className="group p-5 rounded-3xl bg-white dark:bg-[#1E2320] shadow-soft border border-[#E8E6DF] dark:border-neutral-800 hover:border-[#133829]/40 dark:hover:border-emerald-500/40 text-left transition-all hover:-translate-y-0.5 flex flex-col justify-between h-36"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#133829] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm leading-snug group-hover:text-[#133829] dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Fila 2: 2 Tarjetas más anchas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {BENTO_ROW_2.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onQuickPrompt(item.prompt)}
                className="group p-5 rounded-3xl bg-white dark:bg-[#1E2320] shadow-soft border border-[#E8E6DF] dark:border-neutral-800 hover:border-[#133829]/40 dark:hover:border-emerald-500/40 text-left transition-all hover:-translate-y-0.5 flex flex-col justify-between h-36"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#133829] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm leading-snug group-hover:text-[#133829] dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Sección de Lugares Destacados Validados */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-extrabold text-neutral-800 dark:text-neutral-100">
              Lugares Recomendados por Foody
            </h2>
            <p className="text-xs text-neutral-500">
              Datos verificados desde el Portal de Datos Abiertos CABA y OpenStreetMap
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {venues.slice(0, 6).map((venue) => {
            const isFav = favorites.includes(venue.id);
            return (
              <div
                key={venue.id}
                className="group bg-white dark:bg-[#1E2320] rounded-3xl overflow-hidden border border-[#E8E6DF] dark:border-neutral-800 shadow-soft hover:shadow-card transition-all flex flex-col"
              >
                <div className="relative h-40 w-full bg-neutral-100 cursor-pointer" onClick={() => onOpenVenue(venue)}>
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
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                      isFav ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                  </button>
                  <div className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold drop-shadow line-clamp-1">
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
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2 leading-relaxed">
                      {venue.por_que_recomendamos || venue.descripcion}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 italic truncate max-w-[170px]">
                      Fuente: {venue.fuente_principal || 'GCBA'}
                    </span>
                    <button
                      onClick={() => onOpenVenue(venue)}
                      className="font-bold text-[#133829] dark:text-emerald-400 hover:underline flex items-center space-x-0.5 shrink-0"
                    >
                      <span>Ver ficha</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
