'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import PersistentChatBar from '@/components/PersistentChatBar';
import MobileNavBar from '@/components/MobileNavBar';
import VenueModal from '@/components/VenueModal';

import InicioView from '@/views/InicioView';
import ChatView from '@/views/ChatView';
import ExplorarView from '@/views/ExplorarView';
import LugaresView from '@/views/LugaresView';
import FavoritosView from '@/views/FavoritosView';
import PerfilView from '@/views/PerfilView';

import { Search, Sun, Moon, Bell, Sparkles, Menu } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState('inicio');
  const [venues, setVenues] = useState([]);
  const [favorites, setFavorites] = useState([1, 4]); // Don Julio y Sintaxis guardados por defecto
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedZone, setSelectedZone] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [topSearch, setTopSearch] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');

  // Estados de responsividad y colapso
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cargar preferencias guardadas en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('foody_ai_api_key');
      if (storedKey) setCustomApiKey(storedKey);

      const savedCollapse = localStorage.getItem('foody_sidebar_collapsed');
      if (savedCollapse === 'true') setIsSidebarCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('foody_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const handleSaveApiKey = (key) => {
    setCustomApiKey(key);
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('foody_ai_api_key', key);
      } else {
        localStorage.removeItem('foody_ai_api_key');
      }
    }
  };

  // Estado del chat con Foody
  const [messages, setMessages] = useState([
    {
      id: 1,
      remitente: 'foody',
      respuesta: '¡Hola! Soy Foody, tu asistente gastronómico personal de GastronomIA ✨\n\nPuedo recomendarte restaurantes, bodegones históricos, opciones sin TACC, veganas o armarte rutas gastronómicas personalizadas por barrio en CABA y Gran Buenos Aires.\n\n¿Qué tenés ganas de comer hoy?',
      parametros_interpretados: null,
      resultados: []
    }
  ]);
  const [isPending, setIsPending] = useState(false);

  // Cargar establecimientos al iniciar
  useEffect(() => {
    fetch('/api/establecimientos')
      .then(res => res.json())
      .then(data => {
        if (data.establecimientos) {
          setVenues(data.establecimientos);
        }
      })
      .catch(err => console.error('Error fetching venues:', err));
  }, []);

  // Enviar mensaje al backend orquestador (POST /api/chat)
  const handleSendMessage = async (text) => {
    if (!text.trim() || isPending) return;

    // Agregar mensaje del usuario a la lista
    const userMsg = { id: Date.now(), remitente: 'usuario', contenido: text };
    setMessages(prev => [...prev, userMsg]);
    setIsPending(true);
    setActiveView('chat');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consulta: text,
          idUsuario: 1,
          apiKey: customApiKey || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        const botMsg = {
          id: data.mensaje_id || Date.now() + 1,
          remitente: 'foody',
          respuesta: data.respuesta,
          parametros_interpretados: data.parametros_interpretados,
          resultados: data.resultados || []
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errorMsg = {
          id: Date.now() + 1,
          remitente: 'foody',
          respuesta: data.error || 'Lo siento, ocurrió un error al consultar a Foody. Podés intentar nuevamente o explorar el catálogo con los filtros manuales.',
          parametros_interpretados: null,
          resultados: []
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      const netErrorMsg = {
        id: Date.now() + 1,
        remitente: 'foody',
        respuesta: 'Hubo una dificultad de conexión. Activamos el modo fallback local para que puedas seguir buscando.',
        parametros_interpretados: null,
        resultados: []
      };
      setMessages(prev => [...prev, netErrorMsg]);
    } finally {
      setIsPending(false);
    }
  };

  // Favoritos toggle
  const handleToggleFavorite = (venue) => {
    setFavorites(prev =>
      prev.includes(venue.id)
        ? prev.filter(id => id !== venue.id)
        : [...prev, venue.id]
    );
  };

  // Filtrar por zona desde el panel derecho
  const handleSelectZone = (zoneId) => {
    setSelectedZone(zoneId);
    setActiveView('explorar');
  };

  // Búsqueda superior
  const handleTopSearchSubmit = (e) => {
    e.preventDefault();
    if (!topSearch.trim()) return;
    handleSendMessage(topSearch.trim());
    setTopSearch('');
  };

  // Reiniciar chat
  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now(),
        remitente: 'foody',
        respuesta: '¡Hola de nuevo! Reiniciamos la conversación. ¿Qué experiencia gastronómica te gustaría descubrir ahora?',
        parametros_interpretados: null,
        resultados: []
      }
    ]);
  };

  // Actualizar reseña en vivo
  const handleReviewAdded = (reviewData) => {
    if (selectedVenue) {
      fetch(`/api/establecimientos/${selectedVenue.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.establecimiento) {
            setSelectedVenue(data.establecimiento);
            // Actualizar lista global
            setVenues(prev => prev.map(v => v.id === data.establecimiento.id ? data.establecimiento : v));
          }
        });
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-[#111412] text-white' : 'bg-[#F8F7F2] text-[#222623]'}`}>
      {/* 1. Sidebar (Escritorio colapsable + Drawer Móvil) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        favoritesCount={favorites.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Panel Central Principal */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative w-full">
        {/* Top Bar Responsivo */}
        <header className="sticky top-0 z-20 px-3.5 sm:px-6 py-3 sm:py-4 bg-[#F8F7F2]/90 dark:bg-[#111412]/90 backdrop-blur-md border-b border-[#E8E6DF] dark:border-neutral-800 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Botón Menú Hamburguesa en Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-2xl bg-white dark:bg-[#1E2320] border border-[#E8E6DF] dark:border-neutral-700 text-[#133829] dark:text-emerald-400 shadow-sm shrink-0 hover:bg-neutral-50 transition-colors"
            title="Abrir menú"
            aria-label="Abrir menú principal"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo en Mobile */}
          <div
            onClick={() => setActiveView('inicio')}
            className="flex items-center space-x-1.5 md:hidden cursor-pointer shrink-0"
            title="Foody Inicio"
          >
            <div className="w-8 h-8 rounded-xl bg-white/40 dark:bg-neutral-800 p-0.5 ring-1 ring-[#D4AF37]/50 flex items-center justify-center overflow-hidden">
              <Image src="/foody_mascot.png" alt="Foody" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-extrabold text-base tracking-tight font-display text-[#133829] dark:text-white hidden sm:inline">
              Foody
            </span>
          </div>

          {/* Barra de búsqueda redondeada "¿Qué estás buscando hoy?" */}
          <form onSubmit={handleTopSearchSubmit} className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="¿Qué querés comer hoy en CABA o GBA?..."
              className="w-full pl-9 sm:pl-11 pr-9 sm:pr-10 py-2 sm:py-2.5 rounded-full bg-white dark:bg-[#1E2320] text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 border border-[#E8E6DF] dark:border-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#133829]"
            />
            {topSearch.trim() && (
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#133829] dark:text-emerald-400 font-bold"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Iconos de Modo Oscuro, Notificaciones y Avatar */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Toggle Modo Oscuro / Claro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-[#1E2320] border border-[#E8E6DF] dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors shadow-sm"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notificaciones */}
            <button
              onClick={() => alert('GastronomIA: Base conectada con catálogo masivo oficial de CABA y GBA.')}
              className="relative p-2 sm:p-2.5 rounded-full bg-white dark:bg-[#1E2320] border border-[#E8E6DF] dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors shadow-sm hidden xs:flex items-center justify-center"
              title="Notificaciones y Novedades"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            {/* Avatar de Usuario */}
            <button
              onClick={() => setActiveView('perfil')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#133829] text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30 hover:ring-emerald-500 transition-all shadow-sm shrink-0"
              title="Ver mi perfil y preferencias"
            >
              GP
            </button>
          </div>
        </header>

        {/* Contenedor de la Vista Activa con espaciado móvil ergonómico */}
        <div className="flex-1 p-3.5 sm:p-5 md:p-7 max-w-5xl mx-auto w-full pb-28 md:pb-10">
          {activeView === 'inicio' && (
            <InicioView
              onQuickPrompt={handleSendMessage}
              onOpenVenue={setSelectedVenue}
              venues={venues}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeView === 'chat' && (
            <ChatView
              messages={messages}
              onOpenVenue={setSelectedVenue}
              onResetChat={handleResetChat}
              isPending={isPending}
              onQuickPrompt={handleSendMessage}
              customApiKey={customApiKey}
              onSaveApiKey={handleSaveApiKey}
            />
          )}

          {activeView === 'explorar' && (
            <ExplorarView
              venues={venues}
              onOpenVenue={setSelectedVenue}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              selectedZone={selectedZone}
            />
          )}

          {activeView === 'mis-lugares' && (
            <LugaresView
              onOpenVenue={setSelectedVenue}
              venues={venues}
            />
          )}

          {activeView === 'favoritos' && (
            <FavoritosView
              favorites={favorites}
              venues={venues}
              onOpenVenue={setSelectedVenue}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeView === 'perfil' && (
            <PerfilView
              onProfileUpdated={() => {
                alert('¡Tus preferencias han sido actualizadas! Foody las tendrá en cuenta en cada respuesta.');
              }}
            />
          )}
        </div>

        {/* Barra Inferior de Chat Persistente */}
        <PersistentChatBar
          onSendMessage={handleSendMessage}
          isPending={isPending}
        />
      </main>

      {/* 3. Panel Derecho Contextual (solo desktop amplio) */}
      <RightPanel
        onSelectZone={handleSelectZone}
        onOpenExperiences={() => setActiveView('mis-lugares')}
        onAskFoodyExperience={() => handleSendMessage('Armame una ruta gastronómica completa para hoy con los mejores platos')}
      />

      {/* 4. Barra de Navegación Inferior para Celulares */}
      <MobileNavBar
        activeView={activeView}
        setActiveView={setActiveView}
        favoritesCount={favorites.length}
      />

      {/* Modal / Ficha del Establecimiento */}
      {selectedVenue && (
        <VenueModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          isFavorite={favorites.includes(selectedVenue.id)}
          onToggleFavorite={handleToggleFavorite}
          onReviewAdded={handleReviewAdded}
        />
      )}
    </div>
  );
}
