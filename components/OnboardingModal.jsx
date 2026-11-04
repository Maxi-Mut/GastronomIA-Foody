'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Check, MapPin, ShieldCheck, Plus, X } from 'lucide-react';

const STANDARD_RESTRICTIONS = [
  { id: 'sin_tacc', label: 'Celíaco / Sin TACC' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'sin_lactosa', label: 'Sin Lactosa' },
];

const ZONAS = [
  { id: 'CABA', label: 'CABA' },
  { id: 'Zona Norte', label: 'Zona Norte' },
  { id: 'Zona Sur', label: 'Zona Sur' },
  { id: 'Zona Oeste', label: 'Zona Oeste' },
];

export default function OnboardingModal({ isOpen, onComplete, onSkip }) {
  const [nombre, setNombre] = useState('');
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customRestriction, setCustomRestriction] = useState('');
  const [selectedZona, setSelectedZona] = useState('CABA');

  if (!isOpen) return null;

  const isSinRestricciones = selectedRestrictions.length === 0 && !customRestriction.trim();

  const handleSelectSinRestricciones = () => {
    setSelectedRestrictions([]);
    setShowCustomInput(false);
    setCustomRestriction('');
  };

  const handleToggleRestriction = (id) => {
    setSelectedRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleToggleOtro = () => {
    if (showCustomInput) {
      setShowCustomInput(false);
      setCustomRestriction('');
    } else {
      setShowCustomInput(true);
    }
  };

  const handleConfirm = (e) => {
    if (e) e.preventDefault();

    const finalRestrictions = [...selectedRestrictions];
    if (customRestriction.trim()) {
      finalRestrictions.push(customRestriction.trim());
    }

    const profile = {
      nombre: nombre.trim() || 'Comensal',
      restricciones: finalRestrictions,
      zona_preferida: selectedZona,
      presupuesto_preferido: '$$',
      ambiente_preferido: 'Tranquilo y Cálido',
      cocina_favorita: 'Variada',
      configurado: true,
      creado_en: new Date().toISOString(),
    };

    onComplete(profile);
  };

  const handleSkipClick = () => {
    const defaultProfile = {
      nombre: 'Comensal',
      restricciones: [],
      zona_preferida: 'CABA',
      presupuesto_preferido: '$$',
      ambiente_preferido: 'Tranquilo',
      cocina_favorita: 'Variada',
      configurado: true,
      creado_en: new Date().toISOString(),
    };
    if (onSkip) onSkip(defaultProfile);
    else onComplete(defaultProfile);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-lg bg-[#FAF9F5] dark:bg-[#1A231E] rounded-3xl shadow-2xl border border-[#E8E6DF] dark:border-neutral-800 overflow-hidden text-neutral-800 dark:text-neutral-100 max-h-[90vh] flex flex-col">
        {/* Cabecera visual con Foody */}
        <div className="bg-gradient-to-br from-[#133829] to-[#1C4D38] p-6 text-white text-center relative shrink-0">
          <div className="inline-block relative mb-3">
            <div className="w-20 h-20 rounded-3xl bg-white/10 p-2 ring-4 ring-[#D4AF37]/40 shadow-lg mx-auto flex items-center justify-center backdrop-blur-md">
              <Image
                src="/foody_mascot.png"
                alt="Foody Mascota"
                width={70}
                height={70}
                className="object-contain"
                priority
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-[#133829] p-1 rounded-full shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          <h2
            id="onboarding-title"
            className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-white"
          >
            ¡Te damos la bienvenida a GastronomIA!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-sm mx-auto">
            Configurá tu perfil inicial para que <strong>Foody</strong> te recomiende los mejores sabores a tu medida.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Campo Nombre */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              ¿Cómo te llamas?
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Maximiliano"
              autoFocus
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#232D27] text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#133829] dark:focus:ring-emerald-500 shadow-sm transition"
            />
          </div>

          {/* Restricciones Alimentarias */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Restricciones alimentarias opcionales
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Foody filtrará locales con opciones aptas y protocolos verificados.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {/* Chip: Sin Restricciones */}
              <button
                type="button"
                onClick={handleSelectSinRestricciones}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1.5 ${
                  isSinRestricciones
                    ? 'bg-[#133829] text-white border-[#133829] shadow-sm'
                    : 'bg-white dark:bg-[#232D27] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                }`}
              >
                {isSinRestricciones && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                <span>Sin Restricciones</span>
              </button>

              {/* Chips Estándar */}
              {STANDARD_RESTRICTIONS.map((item) => {
                const active = selectedRestrictions.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleRestriction(item.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1.5 ${
                      active
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white dark:bg-[#232D27] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-600'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Chip: Otro */}
              <button
                type="button"
                onClick={handleToggleOtro}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1.5 ${
                  showCustomInput || customRestriction.trim()
                    ? 'bg-[#D4AF37] text-[#133829] border-[#D4AF37] font-bold shadow-sm'
                    : 'bg-white dark:bg-[#232D27] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-amber-400'
                }`}
              >
                <span>Otro</span>
                {showCustomInput ? (
                  <X className="w-3 h-3 ml-0.5" />
                ) : (
                  <Plus className="w-3 h-3 ml-0.5" />
                )}
              </button>
            </div>

            {/* Input para otra restricción */}
            {showCustomInput && (
              <div className="pt-2 animate-fadeIn">
                <input
                  type="text"
                  value={customRestriction}
                  onChange={(e) => setCustomRestriction(e.target.value)}
                  placeholder="Especificá tu restricción (ej: Alergia a mariscos, Kosher, APLV)..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#232D27] text-xs text-neutral-900 dark:text-white border border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] shadow-inner"
                />
              </div>
            )}
          </div>

          {/* Preferencia de Zona Inicial */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Preferencia de zona inicial
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ZONAS.map((z) => {
                const active = selectedZona === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setSelectedZona(z.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center flex items-center justify-center space-x-1.5 ${
                      active
                        ? 'bg-[#133829] text-white border-[#133829] shadow-sm'
                        : 'bg-white dark:bg-[#232D27] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-[#2c3730]'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${active ? 'text-[#D4AF37]' : 'text-neutral-400'}`} />
                    <span>{z.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 space-y-2.5">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-[#133829] hover:bg-[#1a4a37] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 border border-[#D4AF37]/40 hover:scale-[1.01]"
            >
              <span>Comenzar a descubrir</span>
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </button>

            <button
              type="button"
              onClick={handleSkipClick}
              className="w-full py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition text-center"
            >
              Omitir por ahora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

