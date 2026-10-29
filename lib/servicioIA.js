/**
 * GastronomIA - Componente de IA (ServicioIA)
 * 
 * Funcionalidades:
 * 1. Interpretar consultas en lenguaje natural y detectar intenciones conversacionales (saludos, preguntas de identidad, dudas).
 * 2. Generar respuestas cálidas, empáticas y con voz porteña (Foody), evitando volcados rígidos de datos y guiando al usuario.
 * 3. Extraer valoraciones estructuradas a partir de reseñas de usuarios.
 * 4. Soporte multi-proveedor: Google Gemini, Groq (Llama 3.3 / DeepSeek R1), OpenAI + Motor Conversacional Heurístico Local.
 */

const OUT_OF_COVERAGE_ZONES = [
  'cordoba', 'córdoba', 'rosario', 'santa fe', 'mendoza', 'mar del plata',
  'bariloche', 'salta', 'tucuman', 'tucumán', 'neuquen', 'neuquén',
  'la plata', 'uruguay', 'montevideo', 'chile', 'españa', 'espana', 'madrid', 'barcelona'
];

const ZONAS_CANONICAS = {
  'caba': 'CABA',
  'capital': 'CABA',
  'buenos aires': 'CABA',
  'palermo': 'CABA',
  'recoleta': 'CABA',
  'san telmo': 'CABA',
  'belgrano': 'CABA',
  'villa crespo': 'CABA',
  'colegiales': 'CABA',
  'la boca': 'CABA',
  'san nicolas': 'CABA',
  'san nicolás': 'CABA',
  'puerto madero': 'CABA',
  'norte': 'Zona Norte (GBA)',
  'zona norte': 'Zona Norte (GBA)',
  'san isidro': 'Zona Norte (GBA)',
  'vicente lopez': 'Zona Norte (GBA)',
  'vicente lópez': 'Zona Norte (GBA)',
  'olivos': 'Zona Norte (GBA)',
  'san martin': 'Zona Norte (GBA)',
  'san martín': 'Zona Norte (GBA)',
  'boulogne': 'Zona Norte (GBA)',
  'sur': 'Zona Sur (GBA)',
  'zona sur': 'Zona Sur (GBA)',
  'avellaneda': 'Zona Sur (GBA)',
  'lanus': 'Zona Sur (GBA)',
  'lanús': 'Zona Sur (GBA)',
  'banfield': 'Zona Sur (GBA)',
  'quilmes': 'Zona Sur (GBA)',
  'oeste': 'Zona Oeste (GBA)',
  'zona oeste': 'Zona Oeste (GBA)',
  'ramos mejia': 'Zona Oeste (GBA)',
  'ramos mejía': 'Zona Oeste (GBA)',
  'moron': 'Zona Oeste (GBA)',
  'morón': 'Zona Oeste (GBA)',
  'ciudadela': 'Zona Oeste (GBA)'
};

const CONVERSATIONAL_PATTERNS = {
  greeting: [
    'hola', 'buenas', 'buen dia', 'buen día', 'buenas tardes', 'buenas noches',
    'que tal', 'qué tal', 'holis', 'hello', 'hey', 'hola foody', 'buenas foody', 'hola amigo'
  ],
  identity: [
    'quien sos', 'quién sos', 'como te llamas', 'cómo te llamas', 'que sos', 'qué sos',
    'que haces', 'qué hacés', 'que podes hacer', 'qué podés hacer', 'como funcionas', 'cómo funcionas',
    'en que me ayudas', 'en qué me ayudás', 'ayuda', 'para que servis', 'para qué servís'
  ],
  thanks: [
    'gracias', 'muchas gracias', 'joya', 'genial', 'buenisimo', 'buenísimo',
    'de diez', 'graciela', 'mil gracias', 'crack', 'capo', 'espectacular'
  ],
  farewell: [
    'chau', 'adiós', 'adios', 'hasta luego', 'nos vemos', 'bye', 'hasta mañana'
  ]
};

class ServicioIA {
  constructor() {
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  getEffectiveKey(contexto = {}) {
    if (contexto?.apiKey && typeof contexto.apiKey === 'string') return contexto.apiKey.trim();
    return (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  }

  /**
   * Detecta si el texto es puramente conversacional (un saludo, gracias, etc.) y no una búsqueda de comida.
   */
  detectarIntencionConversacional(text) {
    const cleaned = text.toLowerCase().replace(/[^\w\sáéíóúñ]/g, '').trim();
    if (!cleaned) return 'greeting';

    // Saludo simple
    for (const phrase of CONVERSATIONAL_PATTERNS.greeting) {
      if (cleaned === phrase || cleaned.startsWith(phrase + ' ') || cleaned.endsWith(' ' + phrase)) {
        // Asegurarse de que no incluya un término específico de búsqueda
        if (!/(pizza|parrilla|comer|restaurante|cafe|café|barrio|tacc|vegano)/i.test(cleaned)) {
          return 'greeting';
        }
      }
    }

    // Identidad / ¿Quién sos?
    for (const phrase of CONVERSATIONAL_PATTERNS.identity) {
      if (cleaned.includes(phrase)) {
        return 'identity';
      }
    }

    // Agradecimiento
    for (const phrase of CONVERSATIONAL_PATTERNS.thanks) {
      if (cleaned === phrase || cleaned.startsWith(phrase + ' ')) {
        return 'thanks';
      }
    }

    // Despedida
    for (const phrase of CONVERSATIONAL_PATTERNS.farewell) {
      if (cleaned === phrase || cleaned.startsWith(phrase + ' ')) {
        return 'farewell';
      }
    }

    return null;
  }

  /**
   * 1. interpretarConsulta:
   * Extrae { zona, tipo_cocina, rango_precio, ambiente, restricciones, intencion_valida, fuera_de_cobertura, es_conversacional_puro }
   */
  async interpretarConsulta(consulta, contexto = {}) {
    const text = (consulta || '').trim();
    const lower = text.toLowerCase();

    // Detección de conversación pura (saludos, preguntas de identidad)
    const intencionPura = this.detectarIntencionConversacional(text);
    if (intencionPura) {
      return {
        zona: null,
        tipo_cocina: null,
        rango_precio: null,
        ambiente: null,
        restricciones: [],
        intencion_valida: true,
        fuera_de_cobertura: false,
        tipo_intencion: intencionPura,
        es_conversacional_puro: true,
        origen_interpretacion: 'dialogo_conversacional'
      };
    }

    // Detección de fuera de cobertura
    for (const outZone of OUT_OF_COVERAGE_ZONES) {
      const regex = new RegExp(`\\b${outZone}\\b`, 'i');
      if (regex.test(lower)) {
        return {
          zona: outZone.charAt(0).toUpperCase() + outZone.slice(1),
          tipo_cocina: null,
          rango_precio: null,
          ambiente: null,
          restricciones: [],
          intencion_valida: false,
          fuera_de_cobertura: true,
          es_conversacional_puro: false,
          mensaje_aclaratorio: `Foody solo tiene cobertura en CABA y Gran Buenos Aires. Por el momento no cubrimos ${outZone}.`,
          origen_interpretacion: 'reglas_guardrail'
        };
      }
    }

    const key = this.getEffectiveKey(contexto);
    // Intentar con API de IA si la clave tiene formato válido (Google AI Studio: AIzaSy..., Groq: gsk_..., OpenAI: sk-...)
    if (key && (key.startsWith('AIzaSy') || key.startsWith('gsk_') || key.startsWith('sk-'))) {
      try {
        const prompt = `Actúa como el motor NLP de GastronomIA. Analiza la siguiente consulta del comensal y extrae sus criterios en formato JSON estricto.
Consulta: "${text}"
Contexto previo: ${JSON.stringify(contexto)}

Responde ÚNICAMENTE con un JSON con la siguiente estructura:
{
  "zona": string o null (ej: "CABA", "Zona Norte (GBA)", "Zona Sur (GBA)", "Zona Oeste (GBA)", o barrio como "Palermo", "San Telmo", etc.),
  "tipo_cocina": string o null (ej: "Parrilla", "Pizzería", "Pastas", "Cafetería", "Vegana", "Bodegón"),
  "rango_precio": string o null ("$" | "$$" | "$$$"),
  "ambiente": string o null (ej: "Tranquilo", "Familiar", "Elegante", "Animado"),
  "restricciones": array de strings (valores posibles: "sin_tacc", "vegano", "vegetariano", "sin_lactosa"),
  "intencion_valida": boolean,
  "fuera_de_cobertura": boolean,
  "mensaje_aclaratorio": string o null
}`;

        let parsed = null;
        if (key.startsWith('AIzaSy')) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${key}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const data = await res.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]);
          }
        } else if (key.startsWith('gsk_')) {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.1
            }),
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const data = await res.json();
            const raw = data?.choices?.[0]?.message?.content || '';
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]);
          }
        }

        if (parsed) {
          parsed.origen_interpretacion = 'llm_api_activa';
          parsed.es_conversacional_puro = false;
          return parsed;
        }
      } catch (err) {
        console.warn('[ServicioIA] LLM no disponible, conmutando a parser determinístico:', err.message);
      }
    }

    // FALLBACK DETERMINÍSTICO
    return this._fallbackInterpretarConsulta(text, contexto);
  }

  _fallbackInterpretarConsulta(text, contexto) {
    const lower = text.toLowerCase();
    const result = {
      zona: null,
      tipo_cocina: null,
      rango_precio: null,
      ambiente: null,
      restricciones: [],
      intencion_valida: true,
      fuera_de_cobertura: false,
      es_conversacional_puro: false,
      mensaje_aclaratorio: null,
      origen_interpretacion: 'asistente_local'
    };

    // Restricciones del contexto del usuario si existen
    if (contexto?.perfilUsuario?.restricciones && Array.isArray(contexto.perfilUsuario.restricciones)) {
      result.restricciones = [...contexto.perfilUsuario.restricciones];
    }

    // Detectar restricciones explícitas
    if (/sin\s*tacc|celiac|gluten|trigo/i.test(lower)) {
      if (!result.restricciones.includes('sin_tacc')) result.restricciones.push('sin_tacc');
    }
    if (/vegano|vegana|plant\s*based/i.test(lower)) {
      if (!result.restricciones.includes('vegano')) result.restricciones.push('vegano');
    }
    if (/vegetariano|vegetariana|veggie/i.test(lower)) {
      if (!result.restricciones.includes('vegetariano')) result.restricciones.push('vegetariano');
    }
    if (/sin\s*lactosa|deslactosad/i.test(lower)) {
      if (!result.restricciones.includes('sin_lactosa')) result.restricciones.push('sin_lactosa');
    }

    // Detectar zona o barrio
    for (const [k, v] of Object.entries(ZONAS_CANONICAS)) {
      const rx = new RegExp(`\\b${k}\\b`, 'i');
      if (rx.test(lower)) {
        result.zona = v;
        break;
      }
    }

    // Detectar cocina / categoría
    if (/parrilla|asado|carne|bife/i.test(lower)) result.tipo_cocina = 'Parrilla';
    else if (/pizza|pizzería|pizzeria|fugazzetta/i.test(lower)) result.tipo_cocina = 'Pizzería';
    else if (/pasta|ravioles|ñoquis|fideos|italiana/i.test(lower)) result.tipo_cocina = 'Pastas';
    else if (/cafe|café|cafeteria|cafetería|merienda|desayuno|brunch/i.test(lower)) result.tipo_cocina = 'Cafetería';
    else if (/bodegon|bodegón|milanesa|minutas/i.test(lower)) result.tipo_cocina = 'Bodegón';
    else if (/arabe|armenia|medio oriente|falafel/i.test(lower)) result.tipo_cocina = 'Armenia / Medio Oriente';
    else if (/vegan|vegetal/i.test(lower)) result.tipo_cocina = 'Vegana';

    // Detectar rango de precio
    if (/barat[oa]s?|econ[oó]mic[oa]s?|accesible|bajo costo|\$/i.test(lower)) result.rango_precio = '$';
    else if (/car[oa]s?|gourmet|alta gama|lujo|\$\$\$/i.test(lower)) result.rango_precio = '$$$';
    else if (/moderad[oa]s?|precio medio|\$\$/i.test(lower)) result.rango_precio = '$$';

    // Detectar ambiente
    if (/tranquilo|relajado|silencioso/i.test(lower)) result.ambiente = 'Tranquilo';
    else if (/familiar|chicos|familia/i.test(lower)) result.ambiente = 'Familiar';
    else if (/romantico|romántico|pareja|cita/i.test(lower)) result.ambiente = 'Romántico';
    else if (/aire libre|patio|terraza|jardin|jardín/i.test(lower)) result.ambiente = 'Aire libre';

    return result;
  }

  /**
   * 2. generarRespuesta:
   * Redacta con tono conversacional amigable, fluido y empático, guiando al comensal paso a paso.
   */
  async generarRespuesta(consulta, resultados, perfilUsuario = {}, contexto = {}, parametros = {}) {
    // Si la intención es puramente conversacional (ej. "hola foody"), responder con calidez humana
    if (parametros?.es_conversacional_puro) {
      return this._generarRespuestaSaludo(consulta, parametros.tipo_intencion, perfilUsuario);
    }

    const key = this.getEffectiveKey(contexto);
    if (key && (key.startsWith('AIzaSy') || key.startsWith('gsk_') || key.startsWith('sk-'))) {
      try {
        const prompt = `Sos Foody, el asistente gastronómico amigable y experto de Buenos Aires (GastronomIA).
Hablá con voseo porteño cálido, empático, natural y entusiasta (usá '¡De una!', 'Mirá estas opciones...', '¿Te copa?', etc.).
Consulta del comensal: "${consulta}"
Resultados validados de la base de datos oficial (NUNCA inventes locales ajenos a esta lista):
${JSON.stringify(resultados.map(r => ({
  nombre: r.nombre,
  barrio: r.barrio,
  zona: r.zona,
  cocina: r.cocina,
  precio: r.rango_precio,
  motivo: r.por_que_recomendamos,
  fuente: r.fuente_principal || 'Datos Abiertos'
})))}

Perfil y restricciones del usuario: ${JSON.stringify(perfilUsuario)}

Instrucciones de redacción:
1. Sé conversacional y ameno. NO hagas una lista rígida ni pegues todo en un solo bloque. Usá saltos de párrafo claros y prolijos.
2. Presentá 2 o 3 opciones destacadas explicando con tus palabras por qué coinciden con lo que busca.
3. Hacé una pregunta de cierre para seguir afinando sus gustos (ej: "¿Buscás algo con terraza o preferís priorizar precio?").
4. Cita la fuente de los datos.
5. Si hay restricciones alimentarias (especialmente celiaquía/sin TACC), recordá consultar con el local por la contaminación cruzada.`;

        let replyText = null;
        if (key.startsWith('AIzaSy')) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${key}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(4500)
          });
          if (res.ok) {
            const data = await res.json();
            replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          }
        } else if (key.startsWith('gsk_')) {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.6
            }),
            signal: AbortSignal.timeout(4500)
          });
          if (res.ok) {
            const data = await res.json();
            replyText = data?.choices?.[0]?.message?.content;
          }
        }

        if (replyText && replyText.trim()) {
          return replyText.trim();
        }
      } catch (err) {
        console.warn('[ServicioIA] Falló generación con LLM, usando redacción conversacional local:', err.message);
      }
    }

    // Redacción conversacional prolija y fluida local
    return this._fallbackGenerarRespuesta(consulta, resultados, perfilUsuario, parametros);
  }

  _generarRespuestaSaludo(consulta, tipo, perfilUsuario) {
    const nombre = perfilUsuario?.nombre ? ` ${perfilUsuario.nombre}` : '';

    if (tipo === 'thanks') {
      return `¡De nada${nombre}! 😊 Para eso estoy acá. Si querés que busquemos otro lugar, armemos una ruta gastronómica o encontremos opciones especiales, ¡solo avisame! 🍽️✨`;
    }

    if (tipo === 'farewell') {
      return `¡Chau${nombre}! Que disfrutes mucho de tu salida gastronómica. Cuando tengas hambre de nuevo, ya sabés dónde encontrarme. ¡Buen provecho! 👋`;
    }

    if (tipo === 'identity') {
      return `¡Buenas! Soy **Foody**, tu asistente gastronómico inteligente para **Buenos Aires y Gran Buenos Aires** 👨‍🍳✨\n\n` +
             `Mi trabajo es ayudarte a descubrir los mejores rincones culinarios de la ciudad según tus gustos, presupuesto y necesidades.\n\n` +
             `¿En qué te puedo dar una mano hoy?\n` +
             `• ¿Buscás un bodegón tradicional con milanesas gigantes?\n` +
             `• ¿Opciones con protocolo seguro **Sin TACC (celíacos)** o **veganas**?\n` +
             `• ¿Una buena parrilla en Palermo o un café tranquilo en Zona Norte?\n\n` +
             `Contame qué se te antoja o en qué zona andás, ¡y te paso opciones reales al instante!`;
    }

    // Saludo estándar
    return `¡Hola${nombre}! ¡Qué lindo saludarte! Soy **Foody**, tu asistente de GastronomIA 👨‍🍳\n\n` +
           `Estoy acá para recomendarte los mejores sabores y experiencias en CABA y Gran Buenos Aires.\n\n` +
           `¿Qué tenés ganas de comer hoy? Contame por ejemplo si buscás:\n` +
           `• Una parrilla clásica porteña o un bodegón de barrio\n` +
           `• Opciones seguras **Sin TACC**, vegetarianas o veganas\n` +
           `• Un café de especialidad tranquilo para merendar o trabajar\n` +
           `• Alguna zona o presupuesto en particular ($ accesible, $$ moderado, $$$ gourmet)\n\n` +
           `¡Escribime lo que buscás y te voy guiando con lugares validados!`;
  }

  _fallbackGenerarRespuesta(consulta, resultados, perfilUsuario, parametros = {}) {
    if (!resultados || resultados.length === 0) {
      return `¡Buenas! Estuve buscando en nuestros registros gastronómicos pero no encontré establecimientos que coincidan exactamente con todos los filtros combinados.\n\n` +
             `💡 **Mi sugerencia:** Podemos probar ampliando la búsqueda a barrios cercanos o relajando el rango de precio. ¿Te gustaría que busquemos en alguna otra zona de CABA o GBA?`;
    }

    const tieneRestriccion = (parametros.restricciones && parametros.restricciones.length > 0) ||
      resultados.some(r => r.restricciones && r.restricciones.length > 0);

    const intro = `¡De una! Estuve buscando en nuestra base oficial y seleccioné estas excelentes opciones que se adaptan justo a lo que me pedís 👨‍🍳✨:\n\n`;

    const items = resultados.slice(0, 3).map((r, i) => {
      const fuente = r.fuente_principal || (r.fuentes?.[0]?.nombre) || 'Portal de Datos Abiertos GCBA';
      const motivo = r.por_que_recomendamos || `Especialidad destacada en ${r.cocina} con ambiente ${r.ambiente || 'muy agradable'}.`;
      
      return `### ${i + 1}. **${r.nombre}** — *${r.barrio} (${r.zona})*\n` +
             `🍴 **Propuesta:** ${r.cocina} | **Presupuesto:** ${r.rango_precio}\n` +
             `📍 **Ubicación:** ${r.direccion}, ${r.barrio}\n` +
             `💡 **Por qué te va a gustar:** ${motivo}\n` +
             `🏛️ *(Fuente: ${fuente})*\n`;
    }).join('\n');

    let cierre = `\n¿Qué te parecen estas opciones? Si querés podemos afinar por mesas al aire libre, buscar algo aún más económico o cambiar de barrio. ¡Decime y lo ajustamos!`;

    if (tieneRestriccion) {
      cierre += `\n\n⚠️ **Recordatorio importante de salud:** Los registros provienen de declaraciones y habilitaciones oficiales. Antes de consumir, te recomiendo comunicarte con el local para verificar sus protocolos actuales contra la contaminación cruzada.`;
    }

    return intro + items + cierre;
  }

  /**
   * 3. extraerValoraciones:
   * Al crear una reseña en POST /api/resenas, extrae un array JSON de { aspecto, sentimiento, detalle }.
   */
  async extraerValoraciones(textoResena) {
    const text = (textoResena || '').trim();
    if (!text) return [];

    const key = this.getEffectiveKey();
    if (key && (key.startsWith('AIzaSy') || key.startsWith('gsk_') || key.startsWith('sk-'))) {
      try {
        const prompt = `Analiza la siguiente reseña gastronómica y extrae los aspectos evaluados, su sentimiento y un breve detalle.
Reseña: "${text}"

Responde ÚNICAMENTE con un array JSON con esta estructura:
[
  { "aspecto": string (ej: "Comida sin TACC", "Atención", "Ambiente", "Relación Precio/Calidad", "Parrilla"), "sentimiento": "Positivo" | "Neutro" | "Negativo", "detalle": string }
]`;

        let raw = '';
        if (key.startsWith('AIzaSy')) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${key}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const data = await res.json();
            raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        } else if (key.startsWith('gsk_')) {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.1
            }),
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const data = await res.json();
            raw = data?.choices?.[0]?.message?.content || '';
          }
        }

        const match = raw.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
      } catch (err) {
        console.warn('[ServicioIA] Falló extracción con LLM, usando reglas heurísticas:', err.message);
      }
    }

    // Reglas heurísticas locales
    const valoraciones = [];
    const lower = text.toLowerCase();

    if (/sin\s*tacc|celiac|gluten/i.test(lower)) {
      const isNegative = /contaminaci|mal|error|trazas|horrible/i.test(lower);
      valoraciones.push({
        aspecto: 'Comida sin TACC',
        sentimiento: isNegative ? 'Negativo' : 'Positivo',
        detalle: 'Opciones sin gluten evaluadas en la experiencia'
      });
    }

    if (/atenci[oó]n|mozo|personal|servicio/i.test(lower)) {
      const isNegative = /lenta|mala|pesima|pésima|desatento/i.test(lower);
      valoraciones.push({
        aspecto: 'Atención del Personal',
        sentimiento: isNegative ? 'Negativo' : 'Positivo',
        detalle: isNegative ? 'Servicio con demoras o desatención' : 'Atención cordial y atenta'
      });
    }

    if (/precio|caro|barato|cuenta|costo/i.test(lower)) {
      const isNegative = /caro|carisimo|carísimo|estafa/i.test(lower);
      valoraciones.push({
        aspecto: 'Relación Precio/Calidad',
        sentimiento: isNegative ? 'Negativo' : 'Positivo',
        detalle: isNegative ? 'Precios elevados para la propuesta' : 'Precios acordes y convenientes'
      });
    }

    if (/ambiente|ruido|lugar|musica|música|terraza/i.test(lower)) {
      valoraciones.push({
        aspecto: 'Ambiente y Confort',
        sentimiento: 'Positivo',
        detalle: 'Comodidad del espacio gastronómico'
      });
    }

    if (valoraciones.length === 0) {
      valoraciones.push({
        aspecto: 'Experiencia General',
        sentimiento: /excelente|muy buen|rico|genial|recomiendo/i.test(lower) ? 'Positivo' : 'Neutro',
        detalle: 'Comentario general sobre la visita'
      });
    }

    return valoraciones;
  }
}

module.exports = new ServicioIA();
