'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Sparkles, MapPin, ChevronRight, RotateCcw, Key, ShieldAlert, Check, Settings2 } from 'lucide-react';

/**
 * Renderizador de Markdown estructurado y conversacional para los mensajes de Foody
 */
function FormattedBubbleContent({ text = '', onQuickPrompt }) {
  if (!text) return null;

  // Separar párrafos dobles
  const paragraphs = text.split(/\n\s*\n/);

  return (
    <div className="space-y-3.5 text-sm leading-relaxed">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();

        // 1. Bloque de Advertencia Bromatológica / Salud
        if (trimmed.startsWith('⚠️')) {
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start space-x-2.5 my-2"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Aviso de Seguridad Alimentaria</span>
                <span>{trimmed.replace(/^⚠️\s*(\*\*.*?\*\*)?:?\s*/, '')}</span>
              </div>
            </div>
          );
        }

        // 2. Encabezado de local: ej. "### 1. **Don Julio** — *Palermo*"
        if (trimmed.startsWith('###')) {
          const lines = trimmed.split('\n');
          const titleLine = lines[0].replace(/^###\s*/, '');
          const detailLines = lines.slice(1);

          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#F8F7F2] dark:bg-white/5 border border-emerald-900/10 dark:border-neutral-700/60 my-2 space-y-1.5"
            >
              <h4 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-sm flex items-center space-x-1.5 text-[#133829] dark:text-emerald-400">
                <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(titleLine) }} />
              </h4>

              {detailLines.length > 0 && (
                <div className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
                  {detailLines.map((line, lIdx) => (
                    <div key={lIdx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }} />
                  ))}
                </div>
              )}
            </div>
          );
        }

        // 3. Párrafo con viñetas (bullet points: • o -)
        if (trimmed.includes('\n•') || trimmed.includes('\n-') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const lines = trimmed.split('\n');
          return (
            <div key={idx} className="space-y-1.5">
              {lines.map((l, lIdx) => {
                const isBullet = l.trim().startsWith('•') || l.trim().startsWith('-');
                const cleanLine = l.trim().replace(/^[•\-]\s*/, '');
                return isBullet ? (
                  <div key={lIdx} className="flex items-start space-x-2 text-xs sm:text-sm pl-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cleanLine) }} />
                  </div>
                ) : (
                  <p key={lIdx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(l) }} />
                );
              })}
            </div>
          );
        }

        // 4. Párrafo estándar
        return (
          <p
            key={idx}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }}
          />
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-neutral-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-neutral-700 dark:text-neutral-300">$1</em>');
}

export default function ChatView({
  messages = [],
  onOpenVenue,
  onResetChat,
  isPending,
  onQuickPrompt,
  customApiKey,
  onSaveApiKey
}) {
  const bottomRef = useRef(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(customApiKey || '');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (onSaveApiKey) onSaveApiKey(tempKey.trim());
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyModal(false);
    }, 1500);
  };

  const QUICK_SUGGESTIONS = [
    { label: '🌾 Opciones Sin TACC en Palermo', prompt: 'Buscame opciones sin tacc con protocolos cuidados en Palermo' },
    { label: '🥩 Parrillas clásicas en CABA', prompt: 'Recomendame una buena parrilla tradicional porteña con porciones abundantes' },
    { label: '☕ Café de especialidad tranquilo', prompt: 'Quiero un café de especialidad tranquilo para trabajar o merendar' },
    { label: '🍕 Pizzería emblemática', prompt: '¿Cuál es la mejor pizzería clásica porteña de Buenos Aires?' },
    { label: '💰 Algo rico y accesible ($)', prompt: 'Buscame opciones ricas, tradicionales y económicas de bajo presupuesto' },
    { label: '📍 Opciones en Zona Norte', prompt: '¿Qué lugares me recomendás para comer en San Isidro o Vicente López?' }
  ];

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header del Chat */}
      <div className="bg-white dark:bg-[#1E2320] rounded-3xl p-4 sm:p-5 shadow-soft border border-[#E8E6DF] dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#FAF8F2] dark:bg-neutral-800 p-1 border border-emerald-600/30">
            <Image
              src="/foody_mascot.png"
              alt="Foody"
              width={48}
              height={48}
              className="object-contain"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-base text-neutral-900 dark:text-neutral-100 font-display">
                Foody — Tu Asistente Gastronómico
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                customApiKey
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {customApiKey ? '🤖 IA Externa Conectada' : '⚡ Motor Autónomo Activo'}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Conversación en lenguaje natural fundamentada en la base oficial de CABA y GBA
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Botón para Configurar API Key */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F8F7F2] dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 transition-colors border border-neutral-200 dark:border-neutral-700"
            title="Configurar clave de IA (Gemini / Groq / OpenAI)"
          >
            <Key className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Configurar API</span>
          </button>

          {/* Botón para Reiniciar Chat */}
          <button
            onClick={onResetChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Reiniciar conversación"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva charla</span>
          </button>
        </div>
      </div>

      {/* Stream de Mensajes */}
      <div className="space-y-5">
        {messages.map((msg, idx) => {
          const isBot = msg.remitente === 'foody' || msg.role === 'assistant';
          const params = msg.parametros_interpretados || msg.parametros;
          const isGreetingOrEmpty = msg.es_saludo || (!msg.resultados?.length && idx === 0);

          return (
            <div
              key={idx}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-2`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                {isBot && (
                  <div className="w-9 h-9 rounded-full bg-[#133829] flex items-center justify-center p-1 shrink-0 ring-2 ring-emerald-500/30">
                    <Image src="/foody_mascot.png" alt="Foody" width={28} height={28} className="object-contain" />
                  </div>
                )}

                <div
                  className={`p-5 rounded-3xl leading-relaxed shadow-soft ${
                    isBot
                      ? 'bg-white dark:bg-[#1E2320] text-neutral-800 dark:text-neutral-100 border border-[#E8E6DF] dark:border-neutral-800 rounded-tl-sm'
                      : 'bg-[#133829] text-white rounded-tr-sm font-medium'
                  }`}
                >
                  {/* Bloque Visual: "Interpreté: [Zona, Ambiente, Presupuesto, Dieta]" */}
                  {isBot && params && !params.es_conversacional_puro && (
                    <div className="mb-3.5 p-3 rounded-2xl bg-[#F8F7F2] dark:bg-white/5 border border-amber-900/10 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold text-[#133829] dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Criterios identificados en tu consulta:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {params.zona && (
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                            📍 Zona: {params.zona}
                          </span>
                        )}
                        {params.tipo_cocina && (
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                            🍴 Cocina: {params.tipo_cocina}
                          </span>
                        )}
                        {params.rango_precio && (
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                            💰 Presupuesto: {params.rango_precio}
                          </span>
                        )}
                        {params.ambiente && (
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                            🏮 Ambiente: {params.ambiente}
                          </span>
                        )}
                        {params.restricciones && params.restricciones.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            🌾 Dieta: {params.restricciones.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Redacción Conversacional Formateada con Párrafos y Estilo Prolijo */}
                  <FormattedBubbleContent
                    text={msg.contenido || msg.respuesta}
                    onQuickPrompt={onQuickPrompt}
                  />

                  {/* Sugerencias Interactivas Rápidas si es saludo o inicio */}
                  {isBot && isGreetingOrEmpty && onQuickPrompt && (
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-[11px] font-bold text-neutral-400 block mb-2">
                        💡 Tocá una opción para que te busque recomendaciones directas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_SUGGESTIONS.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => onQuickPrompt(sug.prompt)}
                            className="text-xs px-3 py-1.5 rounded-full bg-[#F8F7F2] dark:bg-neutral-800 hover:bg-[#133829] hover:text-white dark:hover:bg-emerald-600 transition-colors border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium"
                          >
                            {sug.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjetas de Establecimientos Recomendados en la Conversación */}
              {isBot && msg.resultados && msg.resultados.length > 0 && (
                <div className="pl-12 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {msg.resultados.map((venue) => (
                    <div
                      key={venue.id}
                      onClick={() => onOpenVenue(venue)}
                      className="group p-3.5 rounded-2xl bg-white dark:bg-[#1E2320] border border-[#E8E6DF] dark:border-neutral-800 shadow-soft hover:shadow-card hover:border-[#133829]/50 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-[#133829] dark:text-emerald-400">
                            {venue.categoria}
                          </span>
                          <span className="font-bold text-[#D4AF37]">
                            {venue.rango_precio}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-[#133829] dark:group-hover:text-emerald-400 transition-colors">
                          {venue.nombre}
                        </h4>
                        <p className="text-xs text-neutral-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{venue.barrio}, {venue.zona}</span>
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2">
                          {venue.por_que_recomendamos || venue.descripcion}
                        </p>
                      </div>

                      {/* Explicit Source Citation */}
                      <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400 truncate max-w-[180px]">
                          <strong>Fuente:</strong> {venue.fuente_principal || 'Datos Abiertos'}
                        </span>
                        <span className="font-bold text-[#133829] dark:text-emerald-400 flex items-center">
                          Ver Ficha <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Indicador de "Escribiendo..." */}
        {isPending && (
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#133829] flex items-center justify-center p-1 shrink-0 animate-pulse">
              <Image src="/foody_mascot.png" alt="Foody" width={28} height={28} className="object-contain" />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-sm bg-white dark:bg-[#1E2320] border border-[#E8E6DF] dark:border-neutral-800 shadow-soft text-xs text-neutral-500 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Foody está interpretando tu pedido y redactando su respuesta...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Modal para Configurar API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1E2320] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-[#133829] dark:text-emerald-400" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Motor de Inteligencia Artificial
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Podés ingresar una clave de <strong>Google AI Studio (Gemini)</strong>, <strong>Groq (Llama 3.3 / DeepSeek)</strong> o <strong>OpenAI</strong> para habilitar generación neuronal en vivo.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                  Tu API Key (Gemini: AIzaSy..., Groq: gsk_..., OpenAI: sk-...)
                </label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Pegá tu clave de API acá..."
                  className="w-full text-xs p-3 rounded-xl bg-[#F8F7F2] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#133829]"
                />
              </div>

              <div className="text-[11px] text-neutral-500 space-y-1 bg-[#FAF8F2] dark:bg-black/20 p-3 rounded-xl">
                <div>• <strong>Modo Local:</strong> Si dejás el campo vacío, Foody opera en modo autónomo determinístico (100% gratis).</div>
                <div>• <strong>Gemini Free:</strong> Obtené una clave en <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-emerald-600 underline">aistudio.google.com</a>.</div>
                <div>• <strong>Groq Free:</strong> Obtené una clave ultrarrápida en <a href="https://console.groq.com/keys" target="_blank" className="text-emerald-600 underline">console.groq.com</a>.</div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {keySaved && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>¡Guardado con éxito!</span>
                  </span>
                )}
                <div className="flex space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-100"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#133829] text-white font-bold text-xs hover:bg-[#1a4a37]"
                  >
                    Guardar y Activar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
