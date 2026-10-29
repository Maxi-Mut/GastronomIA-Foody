'use client';

import React from 'react';
import { Home, Compass, MessageSquare, Heart, User, Sparkles } from 'lucide-react';

export default function MobileNavBar({ activeView, setActiveView, favoritesCount = 0 }) {
  const ITEMS = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'explorar', label: 'Explorar', icon: Compass },
    { id: 'chat', label: 'Foody IA', icon: MessageSquare, isChat: true },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'perfil', label: 'Perfil', icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#133829]/95 dark:bg-[#0E2018]/95 backdrop-blur-lg border-t border-[#1f563f] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
      aria-label="Barra de navegación móvil"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (item.isChat) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center justify-center -mt-5 relative transition-transform active:scale-90`}
                title="Abrir chat con Foody"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#133829] ring-4 ring-white/20 scale-105'
                      : 'bg-emerald-600 text-white ring-4 ring-[#133829] hover:bg-emerald-500'
                  }`}
                >
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-[#D4AF37]' : 'text-emerald-100'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-[#D4AF37] font-bold'
                  : 'text-emerald-200/70 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4AF37]' : ''}`} />
                {item.id === 'favoritos' && favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#D4AF37] text-[#133829] text-[9px] font-extrabold flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
