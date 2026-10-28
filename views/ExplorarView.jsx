import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, MapPin, Heart, ChevronRight, SlidersHorizontal, Map as MapIcon, LayoutGrid } from 'lucide-react';
import ExplorarMap from '@/components/ExplorarMap';

export default function ExplorarView({ venues = [], onOpenVenue, favorites = [], onToggleFavorite, selectedZone = '' }) {
  const [search, setSearch] = useState('');
  const [zona, setZona] = useState(selectedZone);
  const [cocina, setCocina] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [dieta, setDieta] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map' | 'split'

  const ZONAS = ['Todas', 'CABA', 'Zona Norte (GBA)', 'Zona Sur (GBA)', 'Zona Oeste (GBA)'];
  const COCINAS = ['Todas', 'Parrilla', 'Pizzería', 'Pastas', 'Cafetería', 'Bodegón', 'Vegana', 'Armenia'];
  const PRESUPUESTOS = ['Todos', '$', '$$', '$$$'];
  const DIETAS = [
    { id: '', label: 'Todas las dietas' },
    { id: 'sin_tacc', label: '🌾 Sin TACC' },
    { id: 'vegano', label: '🌱 Vegano' },
    { id: 'vegetariano', label: '🥗 Vegetariano' },
    { id: 'sin_lactosa', label: '🥛 Sin Lactosa' },
  ];

  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      if (zona && zona !== 'Todas' && !v.zona.toLowerCase().includes(zona.toLowerCase())) return false;
      if (cocina && cocina !== 'Todas' && !v.cocina.toLowerCase().includes(cocina.toLowerCase()) && !v.categoria.toLowerCase().includes(cocina.toLowerCase())) return false;
      if (presupuesto && presupuesto !== 'Todos' && v.rango_precio !== presupuesto) return false;
      if (dieta) {
        const hasDiet = v.restricciones && v.restricciones.some(r => r.codigo === dieta || r.nombre.toLowerCase().includes(dieta));
        if (!hasDiet) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = v.nombre.toLowerCase().includes(q);
        const matchBarrio = v.barrio.toLowerCase().includes(q);
        const matchCocina = v.cocina.toLowerCase().includes(q);
        if (!matchName && !matchBarrio && !matchCocina) return false;
      }
      return true;
    });
  }, [venues, zona, cocina, presupuesto, dieta, search]);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header y Filtros Manuales */}
      <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-5 sm:p-6 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold font-display text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <SlidersHorizontal className="w-5 h-5 text-[#133829] dark:text-emerald-400" />
              <span>Explorar Catálogo Gastronómico</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Filtros manuales y búsqueda por zona, cocina, presupuesto y mapa con geolocalización
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* View Switcher: Grid vs Map vs Split */}
            <div className="flex bg-[#F8F7F2] dark:bg-neutral-800 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-[#133829] text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
                title="Ver cuadrícula de tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  viewMode === 'map'
                    ? 'bg-[#133829] text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
                title="Ver mapa con ubicaciones"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Mapa</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  viewMode === 'split'
                    ? 'bg-[#133829] text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
                title="Ver mapa y tarjetas a la vez"
              >
                <span className="text-xs">⊞</span>
                <span className="hidden sm:inline">Ambos</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por local o barrio..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#F8F7F2] dark:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#133829]"
              />
            </div>
          </div>
        </div>

        {/* Fila de Filtros Selectores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Selector Zona */}
          <div>
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Zona</label>
            <select
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold focus:outline-none"
            >
              {ZONAS.map((z) => (
                <option key={z} value={z === 'Todas' ? '' : z}>{z}</option>
              ))}
            </select>
          </div>

          {/* Selector Cocina */}
          <div>
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Cocina</label>
            <select
              value={cocina}
              onChange={(e) => setCocina(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold focus:outline-none"
            >
              {COCINAS.map((c) => (
                <option key={c} value={c === 'Todas' ? '' : c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Selector Presupuesto */}
          <div>
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Presupuesto</label>
            <select
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold focus:outline-none"
            >
              {PRESUPUESTOS.map((p) => (
                <option key={p} value={p === 'Todos' ? '' : p}>{p === 'Todos' ? 'Todos los precios' : p}</option>
              ))}
            </select>
          </div>

          {/* Selector Dieta */}
          <div>
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Restricción</label>
            <select
              value={dieta}
              onChange={(e) => setDieta(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold focus:outline-none"
            >
              {DIETAS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Renderizado de Vistas: Mapa o Tarjetas o Ambos */}
      {(viewMode === 'map' || viewMode === 'split') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5">
              <MapIcon className="w-3.5 h-3.5 text-[#133829] dark:text-emerald-400" />
              <span>Mapa con ubicaciones geográficas ({filteredVenues.length} puntos)</span>
            </span>
            <span className="text-[11px] text-neutral-400">
              Hacé clic en cualquier marcador para ver la ficha del local
            </span>
          </div>
          <ExplorarMap venues={filteredVenues} onOpenVenue={onOpenVenue} />
        </div>
      )}

      {(viewMode === 'grid' || viewMode === 'split') && (
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs text-neutral-500 font-semibold">
              Mostrando {filteredVenues.length} {filteredVenues.length === 1 ? 'establecimiento' : 'establecimientos'}
            </span>
            {(zona || cocina || presupuesto || dieta || search) && (
              <button
                onClick={() => { setZona(''); setCocina(''); setPresupuesto(''); setDieta(''); setSearch(''); }}
                className="text-xs font-bold text-[#133829] dark:text-emerald-400 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

        {filteredVenues.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#1E2320] rounded-3xl border border-[#E8E6DF] dark:border-neutral-800 space-y-2">
            <span className="text-3xl">🍽️</span>
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No encontramos resultados para esos filtros</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Probá seleccionando otra zona o limpiando las restricciones para ver más opciones disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVenues.map((venue) => {
              const isFav = favorites.includes(venue.id);
              return (
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
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                        isFav ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
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

                    <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400 truncate max-w-[170px]">
                        {venue.fuente_principal || 'Datos Abiertos'}
                      </span>
                      <button
                        onClick={() => onOpenVenue(venue)}
                        className="font-bold text-[#133829] dark:text-emerald-400 hover:underline flex items-center space-x-0.5 shrink-0"
                      >
                        <span>Ver Ficha</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      )}
    </div>
  );
}
