'use client';

import React from 'react';
import { Home, Compass, Bookmark, Heart, User, Sparkles } from 'lucide-react';

export default function MobileNavBar({ activeView, setActiveView, favoritesCount = 0 }) {
  const ITEMS = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'explorar', label: 'Explorar', icon: Compass },
    { id: 'chat', label: 'Foody', icon: Sparkles, isSpecial: true },
    { id: 'mis-lugares', label: 'Mis lugares', icon: Bookmark },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'perfil', label: 'Perfil', icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#133829]/95 dark:bg-[#0E2018]/95 backdrop-blur-lg border-t border-[#1f563f] px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
      aria-label="Barra de navegación móvil"
    >
      <div className="grid grid-cols-6 items-center max-w-lg mx-auto">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isSpecial = item.isSpecial;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all relative group ${
                isActive
                  ? 'text-[#D4AF37] font-bold'
                  : 'text-emerald-200/70 hover:text-white'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <div className="relative flex items-center justify-center">
                {isSpecial ? (
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#133829] shadow-md ring-2 ring-white/30 scale-105'
                        : 'bg-emerald-600/90 text-white shadow-sm hover:bg-emerald-500'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center">
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#D4AF37]' : ''}`} />
                  </div>
                )}

                {item.id === 'favoritos' && favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#D4AF37] text-[#133829] text-[9px] font-extrabold flex items-center justify-center ring-1 ring-[#133829]">
                    {favoritesCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] sm:text-[10px] leading-tight mt-0.5 tracking-tight text-center truncate max-w-full ${
                isSpecial && !isActive ? 'text-emerald-100 font-semibold' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
