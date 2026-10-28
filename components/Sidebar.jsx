'use client';

import React from 'react';
import Image from 'next/image';
import { Home, MessageSquare, Compass, Bookmark, Heart, User } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'explorar', label: 'Explorar', icon: Compass },
  { id: 'mis-lugares', label: 'Mis lugares', icon: Bookmark },
  { id: 'favoritos', label: 'Favoritos', icon: Heart },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export default function Sidebar({ activeView, setActiveView, favoritesCount = 0 }) {
  return (
    <aside className="w-64 bg-[#133829] text-white flex flex-col justify-between shrink-0 select-none shadow-xl border-r border-[#1a4a37] z-30 min-h-screen">
      {/* Header del Sidebar */}
      <div>
        <div className="p-6 border-b border-[#1f563f]/60 flex items-center space-x-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10 p-1 ring-2 ring-[#D4AF37]/40 shrink-0">
            <Image
              src="/foody_mascot.png"
              alt="Foody Avatar"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white font-display">Foody</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#D4AF37] text-[#133829] font-bold">IA</span>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium">Tu asistente de GastronomIA</p>
          </div>
        </div>

        {/* Menú de Navegación Vertical */}
        <nav className="p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
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

      {/* Footer del Sidebar con Iconos Culturales Dorados */}
      <div className="p-5 border-t border-[#1f563f]/60 text-center">
        <div className="flex justify-center items-center space-x-3 text-[#D4AF37] text-base mb-2 font-mono tracking-widest opacity-90">
          <span>♜</span>
          <span>△</span>
          <span className="text-xs">||</span>
          <span>△</span>
          <span>♜</span>
        </div>
        <p className="text-xs text-emerald-200/90 font-medium tracking-wide">
          Buenos Aires y Gran Buenos Aires
        </p>
        <div className="mt-1 flex justify-center text-[#D4AF37] text-xs">
          <span>♡</span>
        </div>
      </div>
    </aside>
  );
}
