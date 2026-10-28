'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, MapPin, Phone, Globe, ShieldAlert, Star, Send, Sparkles, Heart } from 'lucide-react';

export default function VenueModal({ venue, onClose, isFavorite, onToggleFavorite, onReviewAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  if (!venue) return null;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establecimiento_id: venue.id,
          usuario_id: 1,
          puntuacion: rating,
          comentario: comment.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReviewSuccess(true);
        setComment('');
        if (onReviewAdded) onReviewAdded(data);
        setTimeout(() => setReviewSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const fuente = venue.fuente_principal || venue.fuentes?.[0]?.nombre || 'Portal de Datos Abiertos GCBA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1B211D] rounded-3xl shadow-2xl overflow-hidden border border-[#E8E6DF] dark:border-neutral-800 max-h-[90vh] flex flex-col">
        {/* Header con Imagen */}
        <div className="relative h-56 sm:h-64 w-full bg-neutral-900 shrink-0">
          <Image
            src={venue.imagen_url || '/zone_caba.jpg'}
            alt={venue.nombre}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          
          {/* Botones Flotantes Superiores */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <button
              onClick={() => onToggleFavorite(venue)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
              title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
              title="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Título y Badges */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#133829] text-white border border-emerald-500/40">
                {venue.categoria}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D4AF37] text-[#133829]">
                {venue.rango_precio}
              </span>
              <span className="text-xs text-neutral-300 font-medium">
                {venue.zona}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
              {venue.nombre}
            </h2>
          </div>
        </div>

        {/* Contenido Scrolleable */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* BANNER AMARILLO OBLIGATORIO DE ADVERTENCIA ALIMENTARIA */}
          <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800 text-[#92400E] dark:text-amber-200 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block text-sm mb-0.5">Información alimentaria</span>
              La información disponible no garantiza la ausencia de contaminación cruzada. Confirmá siempre con el local antes de consumir.
            </div>
          </div>

          {/* Bloque: ¿Por qué te lo recomendamos? */}
          <div className="p-4 rounded-2xl bg-[#F8F7F2] dark:bg-white/5 border border-[#E8E6DF] dark:border-neutral-800">
            <div className="flex items-center space-x-2 text-[#133829] dark:text-emerald-400 font-bold mb-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>¿Por qué te lo recomendamos?</span>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {venue.por_que_recomendamos || venue.descripcion}
            </p>
          </div>

          {/* Datos de Contacto y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-[#E8E6DF] dark:border-neutral-700">
              <MapPin className="w-4 h-4 text-[#133829] dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-400 block font-medium">Dirección y Barrio</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-100 line-clamp-1">
                  {venue.direccion}, {venue.barrio}
                </span>
              </div>
            </div>

            {venue.telefono ? (
              <a
                href={`tel:${venue.telefono.replace(/[^\d+]/g, '')}`}
                className="flex items-center space-x-3 p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-[#E8E6DF] dark:border-neutral-700 hover:border-[#133829] transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">Teléfono directo</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {venue.telefono}
                  </span>
                </div>
              </a>
            ) : (
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-[#E8E6DF] dark:border-neutral-700 text-neutral-400">
                <Phone className="w-4 h-4 shrink-0" />
                <div>
                  <span className="text-[11px] block font-medium">Teléfono</span>
                  <span className="text-xs">No registrado</span>
                </div>
              </div>
            )}

            {venue.website && (
              <a
                href={venue.website.startsWith('http') ? venue.website : `https://${venue.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-[#E8E6DF] dark:border-neutral-700 hover:border-[#133829] transition-colors col-span-1 sm:col-span-2"
              >
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">Sitio Web / Red Social</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                    {venue.website}
                  </span>
                </div>
              </a>
            )}
          </div>

          {/* Opciones Dietarias con Nivel de Información */}
          {venue.restricciones && venue.restricciones.length > 0 && (
            <div>
              <h4 className="font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                Aptitud y Opciones Especiales Registradas
              </h4>
              <div className="space-y-2">
                {venue.restricciones.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs">
                    <span className="font-bold text-[#133829] dark:text-emerald-300">
                      🌾 {r.nombre}
                    </span>
                    <span className="text-emerald-800 dark:text-emerald-400 font-medium italic">
                      {r.nivel_informacion || 'Opciones identificadas'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fuente Oficial del Dato */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
            <span><strong>Fuente del dato:</strong> {fuente}</span>
            <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-[10px] uppercase font-bold text-neutral-700 dark:text-neutral-300">
              Validado
            </span>
          </div>

          {/* Sección de Reseñas y Valoraciones Extraídas */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <h4 className="font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center justify-between">
              <span>Reseñas de la Comunidad ({venue.resenas?.length || 0})</span>
            </h4>

            {venue.resenas && venue.resenas.length > 0 ? (
              <div className="space-y-3 mb-4">
                {venue.resenas.map((res) => (
                  <div key={res.id} className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-amber-500 font-bold">
                        {Array.from({ length: res.puntuacion || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-neutral-400">{res.fecha}</span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed">
                      "{res.comentario}"
                    </p>

                    {/* Valoraciones extraídas por IA */}
                    {res.valoraciones && res.valoraciones.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {res.valoraciones.map((val, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              val.sentimiento === 'Positivo'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : val.sentimiento === 'Negativo'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                            }`}
                            title={val.detalle}
                          >
                            🤖 {val.aspecto}: {val.sentimiento}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic mb-4">Sé el primero en dejar una reseña para este lugar.</p>
            )}

            {/* Formulario de Reseña */}
            <form onSubmit={handleSubmitReview} className="space-y-3 bg-[#FAF9F5] dark:bg-white/5 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                Dejar tu reseña (la IA extraerá aspectos y valoraciones automáticamente):
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-neutral-500 font-medium">Puntuación:</span>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    className="p-1 text-base focus:outline-none"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        val <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300 dark:text-neutral-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Contanos tu experiencia: ¿Qué probaste? ¿Cómo fue la atención o las opciones sin gluten/veganas?"
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#133829] resize-none"
                required
              />

              <div className="flex items-center justify-between">
                {reviewSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold animate-fadeIn">
                    ✓ ¡Reseña guardada y valoraciones analizadas!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="px-4 py-2 rounded-xl bg-[#133829] text-white font-bold text-xs hover:bg-[#1a4a37] disabled:opacity-50 transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Analizando...' : 'Publicar Reseña'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
