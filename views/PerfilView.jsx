'use client';

import React, { useState, useEffect } from 'react';
import { User, Check, ShieldAlert, Sparkles, Save } from 'lucide-react';

const RESTRICCIONES_LIST = [
  { id: 'sin_tacc', label: 'Celíaco / Sin TACC', desc: 'Libre de trigo, avena, cebada y centeno (alimentos seguros para celíacos)' },
  { id: 'vegano', label: 'Vegano', desc: 'Exclusivamente origen 100% vegetal, sin ingredientes derivados de animales' },
  { id: 'vegetariano', label: 'Vegetariano', desc: 'Sin carnes rojas, blancas ni pescados; apto huevos y lácteos' },
  { id: 'sin_lactosa', label: 'Sin Lactosa', desc: 'Alternativas deslactosadas o leches vegetales (almendra, avena)' },
];

export default function PerfilView({ onProfileUpdated }) {
  const [user, setUser] = useState(null);
  const [nombre, setNombre] = useState('');
  const [presupuesto, setPresupuesto] = useState('$$');
  const [ambiente, setAmbiente] = useState('Tranquilo y Cálido');
  const [cocina, setCocina] = useState('Parrilla Argentina');
  const [restricciones, setRestricciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/usuarios/1')
      .then(res => res.json())
      .then(data => {
        if (data.usuario) {
          setUser(data.usuario);
          setNombre(data.usuario.nombre || 'Gastrónomo Porteño');
          setPresupuesto(data.usuario.presupuesto_preferido || '$$');
          setAmbiente(data.usuario.ambiente_preferido || 'Tranquilo y Cálido');
          setCocina(data.usuario.cocina_favorita || 'Parrilla Argentina');
          setRestricciones(data.usuario.restricciones || []);
        }
      })
      .catch(err => console.error('Error fetching profile:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleRestriccion = (id) => {
    setRestricciones(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/usuarios/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          presupuesto_preferido: presupuesto,
          ambiente_preferido: ambiente,
          cocina_favorita: cocina,
          restricciones
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSavedSuccess(true);
        if (onProfileUpdated) onProfileUpdated(data.usuario);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-neutral-400">
        Cargando perfil y preferencias...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-6 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-[#133829] text-white flex items-center justify-center font-bold text-xl shadow-md ring-2 ring-emerald-500/20">
          <User className="w-7 h-7 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold font-display text-neutral-900 dark:text-neutral-100">
            Perfil y Preferencias Gastronómicas
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Personalizá tus restricciones y gustos para que Foody adapte automáticamente todas sus recomendaciones.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sección: Restricciones Alimentarias */}
        <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-6 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 text-neutral-800 dark:text-neutral-100 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Restricciones Alimentarias y Dietarias</span>
          </div>
          <p className="text-xs text-neutral-500">
            Foody priorizará locales con protocolos verificados y aplicará siempre las advertencias bromatológicas correspondientes.
          </p>

          <div className="space-y-2.5 pt-1">
            {RESTRICCIONES_LIST.map((r) => {
              const isChecked = restricciones.includes(r.id);
              return (
                <label
                  key={r.id}
                  onClick={() => handleToggleRestriccion(r.id)}
                  className={`flex items-start space-x-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/50 text-[#133829] dark:text-emerald-300'
                      : 'bg-[#F8F7F2] dark:bg-white/5 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isChecked ? 'bg-[#133829] text-white' : 'border border-neutral-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block text-sm">{r.label}</span>
                    <span className="text-neutral-500 dark:text-neutral-400 leading-relaxed block mt-0.5">
                      {r.desc}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sección: Preferencias de Presupuesto, Ambiente y Cocina */}
        <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-6 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 text-neutral-800 dark:text-neutral-100 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Gustos y Preferencias Habituales</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 block mb-1">
                Tu Nombre o Apodo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#133829]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 block mb-1">
                Rango de Presupuesto Habitual
              </label>
              <select
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold focus:outline-none"
              >
                <option value="$">Accesible ($ - Barato y al paso)</option>
                <option value="$$">Moderado ($$ - Salida estándar)</option>
                <option value="$$$">Alto ($$$ - Gourmet y alta gama)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 block mb-1">
                Ambiente Preferido
              </label>
              <select
                value={ambiente}
                onChange={(e) => setAmbiente(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold focus:outline-none"
              >
                <option value="Tranquilo y Cálido">Tranquilo y Cálido</option>
                <option value="Familiar y Animado">Familiar y Animado</option>
                <option value="Romántico e Íntimo">Romántico e Íntimo</option>
                <option value="Aire libre / Jardín">Aire libre / Terraza o Jardín</option>
                <option value="Moderno y Descontracturado">Moderno y Descontracturado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 block mb-1">
                Cocina Favorita
              </label>
              <select
                value={cocina}
                onChange={(e) => setCocina(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold focus:outline-none"
              >
                <option value="Parrilla Argentina">Parrilla Argentina</option>
                <option value="Pizzería Porteña">Pizzería Porteña</option>
                <option value="Pastas Italianas">Pastas Italianas</option>
                <option value="Bodegón Tradicional">Bodegón Tradicional</option>
                <option value="Cafetería de Especialidad">Cafetería de Especialidad</option>
                <option value="Cocina Vegana / Orgánica">Cocina Vegana / Orgánica</option>
                <option value="Armenia / Medio Oriente">Armenia / Medio Oriente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex items-center justify-between p-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>¡Preferencias guardadas exitosamente en la base de datos!</span>
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-[#133829] hover:bg-[#1a4a37] text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <span>{saving ? 'Guardando...' : 'Guardar Preferencias'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
