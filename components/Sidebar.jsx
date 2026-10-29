'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Home, 
  MessageSquare, 
  Compass, 
  Bookmark, 
  Heart, 
  User, 
  PanelLeftClose, 
  PanelLeftOpen, 
  X,
  Sparkles
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'chat', label: 'Chat con Foody', shortLabel: 'Chat', icon: MessageSquare },
  { id: 'explorar', label: 'Explorar', icon: Compass },
  { id: 'mis-lugares', label: 'Mis lugares', icon: Bookmark },
  { id: 'favoritos', label: 'Favoritos', icon: Heart },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export default function Sidebar({
  activeView,
  setActiveView,
  favoritesCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) {
  const handleNavClick = (id) => {
    setActiveView(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* =========================================================================
          1. BACKDROP OVERLAY PARA DISPOSITIVOS MÓVILES (CELULARES)
         ========================================================================= */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 animate-fadeIn"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          2. SIDEBAR MÓVIL (DRAWER DESLIZABLE OFF-CANVAS)
         ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#133829] text-white flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú principal de navegación móvil"
      >
        <div>
          {/* Header del Drawer Móvil */}
          <div className="p-5 border-b border-[#1f563f]/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white/10 p-1 ring-2 ring-[#D4AF37]/50 shrink-0">
                <Image
                  src="/foody_mascot.png"
                  alt="Foody Avatar"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white font-display">Foody</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D4AF37] text-[#133829] font-bold">IA</span>
                </div>
                <p className="text-[11px] text-emerald-200/80 font-medium">GastronomIA Móvil</p>
              </div>
            </div>

            {/* Botón Cerrar Drawer */}
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-xl text-emerald-200/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menú de Navegación Vertical para Celular */}
          <nav className="p-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner font-bold border border-white/20 backdrop-blur-sm'
                      : 'text-emerald-100/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4AF37]' : 'text-emerald-300/70'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'favoritos' && favoritesCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#133829] font-bold">
                      {favoritesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer del Drawer Móvil */}
        <div className="p-5 border-t border-[#1f563f]/60 text-center">
          <div className="flex justify-center items-center space-x-3 text-[#D4AF37] text-base mb-1 font-mono tracking-widest opacity-90">
            <span>♜</span>
            <span>△</span>
            <span className="text-xs">||</span>
            <span>△</span>
            <span>♜</span>
          </div>
          <p className="text-xs text-emerald-200/90 font-medium">
            Buenos Aires y Gran Buenos Aires
          </p>
        </div>
      </aside>

      {/* =========================================================================
          3. SIDEBAR DE ESCRITORIO (RESPONSIVE & COLAPSABLE)
         ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 select-none shadow-xl border-r border-[#1a4a37] z-30 min-h-screen bg-[#133829] text-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Menú lateral de navegación"
      >
        <div>
          {/* Header del Sidebar */}
          <div
            className={`border-b border-[#1f563f]/60 transition-all duration-300 ${
              isCollapsed
                ? 'p-3.5 flex flex-col items-center space-y-2'
                : 'p-5 flex items-center justify-between'
            }`}
          >
            {/* Logo y Nombre */}
            <div
              className={`flex items-center cursor-pointer transition-opacity ${
                isCollapsed ? 'justify-center' : 'space-x-3'
              }`}
              onClick={() => handleNavClick('inicio')}
              title="Volver al inicio"
            >
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white/10 p-1 ring-2 ring-[#D4AF37]/40 shrink-0 flex items-center justify-center">
                <Image
                  src="/foody_mascot.png"
                  alt="Foody Avatar"
                  width={42}
                  height={42}
                  className="object-contain"
                />
              </div>

              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-xl tracking-tight text-white font-display">Foody</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D4AF37] text-[#133829] font-bold">IA</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 font-medium whitespace-nowrap">
                    GastronomIA
                  </p>
                </div>
              )}
            </div>

            {/* Botón de Colapsar / Expandir en Desktop */}
            <button
              onClick={onToggleCollapse}
              className={`p-2 rounded-xl text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors ${
                isCollapsed ? 'mt-1' : 'ml-auto'
              }`}
              title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
              aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-[#D4AF37]" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className={`p-3 space-y-1.5 ${isCollapsed ? 'px-2' : ''}`}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center rounded-2xl text-sm font-semibold transition-all duration-200 relative group ${
                    isCollapsed
                      ? 'justify-center p-3'
                      : 'justify-between px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner font-bold border border-white/20 backdrop-blur-sm'
                      : 'text-emerald-100/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3.5'}`}>
                    <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-[#D4AF37]' : 'text-emerald-300/70'}`} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {/* Badge en modo Expandido */}
                  {!isCollapsed && item.id === 'favoritos' && favoritesCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#133829] font-bold">
                      {favoritesCount}
                    </span>
                  )}

                  {/* Badge flotante en modo Colapsado */}
                  {isCollapsed && item.id === 'favoritos' && favoritesCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D4AF37] text-[#133829] text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[#133829]">
                      {favoritesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar Desktop */}
        <div className={`border-t border-[#1f563f]/60 text-center transition-all ${isCollapsed ? 'p-3' : 'p-4'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex justify-center items-center space-x-3 text-[#D4AF37] text-sm mb-1.5 font-mono tracking-widest opacity-90">
                <span>♜</span>
                <span>△</span>
                <span className="text-xs">||</span>
                <span>△</span>
                <span>♜</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium tracking-wide">
                Buenos Aires y Gran Buenos Aires
              </p>
              <div className="mt-1 flex justify-center text-[#D4AF37] text-xs">
                <span>♡</span>
              </div>
            </>
          ) : (
            <div className="text-[#D4AF37] text-base flex justify-center" title="Buenos Aires & GBA">
              <span>♜</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
