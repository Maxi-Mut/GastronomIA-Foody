/**
 * GastronomIA - Componente de IA (ServicioIA)
 * 
 * Funcionalidades:
 * 1. Interpretar consultas en lenguaje natural y detectar intenciones conversacionales (saludos, preguntas de identidad, dudas).
 * 2. Generar respuestas cálidas, empáticas y con voz porteña (Foody), integrando inteligencia artificial generativa con la base oficial.
 * 3. Extraer valoraciones estructuradas a partir de reseñas de comensales.
 * 4. Soporte multi-proveedor robusto: Google Gemini (con failover automático entre gemini-3.5-flash-lite, 3.5-flash y 3.8-flash), Groq, OpenAI + Motor Conversacional Local.
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
    'hola', 'buenas', 'buen dia', 'buen día', 'buenos dias', 'buenos días',
    'buenas tardes', 'buenas noches', 'que tal', 'qué tal', 'holis', 'hello', 'hey',
    'hola foody', 'buenas foody', 'hola amigo', 'como estas', 'cómo estás', 'como andas',
    'cómo andás', 'como va', 'cómo va', 'todo bien', 'que onda', 'qué onda', 'que contas', 'qué contás'
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
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  }

  getEffectiveKey(contexto = {}) {
    if (contexto?.apiKey && typeof contexto.apiKey === 'string' && contexto.apiKey.trim()) {
      return contexto.apiKey.trim();
    }
    return (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  }

  /**
   * Llamada centralizada y tolerante a fallos a cualquier proveedor de IA.
   * Soporta Google Gemini (claves AQ..., AIzaSy...), Groq (gsk_...) y OpenAI (sk-...).
   */
  async callAI(prompt, key, options = {}) {
    if (!key) return null;

    // 1. Groq
    if (key.startsWith('gsk_')) {
      return this._callGroq(prompt, key, options);
    }

    // 2. OpenAI
    if (key.startsWith('sk-') && !key.startsWith('sk-ant-')) {
      return this._callOpenAI(prompt, key, options);
    }

    // 3. Google Gemini (Claves oficiales de Google AI Studio / Cloud)
    return this._callGemini(prompt, key, options);
  }

  async _callGemini(prompt, key, options = {}) {
    const modelsToTry = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash'
    ].filter(Boolean);

    const uniqueModels = [...new Set(modelsToTry)];

    for (const model of uniqueModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const payload = {
          contents: [{ parts: [{ text: prompt }] }]
        };
        if (options.temperature !== undefined) {
          payload.generationConfig = { temperature: options.temperature };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(options.timeout || 6000)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`[ServicioIA] Gemini ${model} HTTP ${res.status}:`, errData?.error?.message || res.statusText);
        }
      } catch (err) {
        console.warn(`[ServicioIA] Error conectando con Gemini (${model}):`, err.message);
      }
    }

    return null;
  }

  async _callGroq(prompt, key, options = {}) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature !== undefined ? options.temperature : 0.6
        }),
        signal: AbortSignal.timeout(options.timeout || 5000)
      });
      if (res.ok) {
        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() || null;
      }
    } catch (err) {
      console.warn('[ServicioIA] Error con Groq:', err.message);
    }
    return null;
  }

  async _callOpenAI(prompt, key, options = {}) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature !== undefined ? options.temperature : 0.6
        }),
        signal: AbortSignal.timeout(options.timeout || 5000)
      });
      if (res.ok) {
        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() || null;
      }
    } catch (err) {
      console.warn('[ServicioIA] Error con OpenAI:', err.message);
    }
    return null;
  }

  /**
   * Detecta si el texto es puramente conversacional (un saludo, gracias, etc.) y no una búsqueda de comida.
   */
  detectarIntencionConversacional(text) {
    const cleaned = text.toLowerCase().replace(/[^\w\sáéíóúñ]/g, '').trim();
    if (!cleaned) return 'greeting';

    const hasFoodTerm = /(pizza|parrilla|comer|restaurante|resto|cafe|café|barrio|tacc|celiac|vegano|vegetariano|asado|bodegon|bodegón|almorzar|cenar|desayunar|merendar)/i.test(cleaned);

    // Saludo simple o preguntas como "¿cómo estás?", "¿cómo andás?"
    for (const phrase of CONVERSATIONAL_PATTERNS.greeting) {
      if (cleaned === phrase || cleaned.startsWith(phrase + ' ') || cleaned.endsWith(' ' + phrase) || cleaned.includes(phrase)) {
        if (!hasFoodTerm) return 'greeting';
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
      if (cleaned === phrase || cleaned.startsWith(phrase + ' ') || cleaned.endsWith(' ' + phrase)) {
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

    // Detección de conversación pura (saludos, preguntas de cómo estás, etc.)
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
    if (key) {
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

        const raw = await this.callAI(prompt, key, { temperature: 0.1, timeout: 5000 });
        if (raw) {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            parsed.origen_interpretacion = 'llm_api_activa';
            parsed.es_conversacional_puro = false;
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[ServicioIA] LLM falló al interpretar consulta, conmutando a parser determinístico:', err.message);
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
    const key = this.getEffectiveKey(contexto);

    // Si la intención es puramente conversacional (ej. "¿cómo estás?", "hola foody")
    if (parametros?.es_conversacional_puro) {
      if (key) {
        try {
          const prompt = `Sos Foody, el asistente gastronómico experto, cálido y simpático de Buenos Aires (GastronomIA).
El usuario te dice: "${consulta}".
Nombre del usuario: ${perfilUsuario?.nombre || 'amigo/a'}.
Respondé de manera natural, cercana y alegre, usando voseo porteño moderado y entusiasta (como un amigo porteño que conoce los mejores bodegones y restaurantes).
Contale cómo estás y preguntale qué tiene ganas de comer hoy o qué plan gastronómico busca armar en CABA o GBA.`;
          const reply = await this.callAI(prompt, key, { temperature: 0.7, timeout: 5000 });
          if (reply) return reply;
        } catch (err) {
          console.warn('[ServicioIA] Error en saludo con IA:', err.message);
        }
      }
      return this._generarRespuestaSaludo(consulta, parametros.tipo_intencion, perfilUsuario);
    }

    // Si hay una clave activa, generamos respuesta neuronal integrada con los locales reales
    if (key) {
      try {
        const prompt = `Sos Foody, el asistente gastronómico amigable y experto de Buenos Aires (GastronomIA).
Hablá con voseo porteño cálido, empático, natural y entusiasta (usá '¡De una!', 'Mirá estas opciones...', '¿Te copa?', etc.). NUNCA uses respuestas robóticas ni repetitivas.
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

        const replyText = await this.callAI(prompt, key, { temperature: 0.7, timeout: 6500 });
        if (replyText) return replyText;
      } catch (err) {
        console.warn('[ServicioIA] Error generando respuesta con LLM, usando fallback local:', err.message);
      }
    }

    // FALLBACK DETERMINÍSTICO HUMANO
    return this._fallbackGenerarRespuesta(consulta, resultados, perfilUsuario, parametros);
  }

  _generarRespuestaSaludo(consulta, tipo, perfilUsuario) {
    const nombre = perfilUsuario?.nombre ? ` ${perfilUsuario.nombre}` : '';

    if (tipo === 'thanks') {
      return `¡De nada${nombre}! 😊 Para eso estoy acá. Si querés que busquemos otro lugar, armemos una ruta gastronómica o encontremos opciones especiales, ¡solo avisame! 🍽️`;
    }

    if (tipo === 'farewell') {
      return `¡Chau${nombre}! Que disfrutes mucho de tu salida gastronómica. Cuando tengas hambre de nuevo, ya sabés dónde encontrarme. ¡Buen provecho! 👋`;
    }

    if (tipo === 'identity') {
      return `¡Buenas! Soy **Foody**, tu asistente gastronómico inteligente para **Buenos Aires y Gran Buenos Aires** 👨‍🍳\n\n` +
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

    const intro = `¡De una! Estuve buscando en nuestra base oficial y seleccioné estas excelentes opciones que se adaptan justo a lo que me pedís 👨‍🍳:\n\n`;

    const items = resultados.slice(0, 3).map((r, i) => {
      const barrioZona = r.barrio ? `${r.barrio} (${r.zona})` : r.zona;
      const fuente = r.fuente_principal || 'Datos Abiertos GCBA / OSM';
      return `### ${i + 1}. **${r.nombre}** — *${barrioZona}*\n` +
             `🍴 **Propuesta:** ${r.cocina || r.categoria} | **Presupuesto:** ${r.rango_precio}\n` +
             `📍 **Ubicación:** ${r.direccion || 'Consultar mapa interactivo'}\n` +
             `💡 **Por qué te va a gustar:** ${r.por_que_recomendamos || r.descripcion}\n` +
             `🏛️ *(Fuente: ${fuente})*`;
    }).join('\n\n');

    let cierre = `\n\n¿Qué te parece alguna de estas opciones? ¿Querés que te pase más detalles del menú, cómo llegar o buscar en otro barrio?`;

    if (tieneRestriccion) {
      cierre += `\n\n⚠️ **Aviso de Seguridad:** Aunque estos establecimientos declaran opciones aptas en fuentes públicas, te recomendamos consultar siempre al ingresar sobre las medidas para evitar contaminación cruzada.`;
    }

    return intro + items + cierre;
  }

  /**
   * 3. extraerValoracionesResena:
   * Extrae aspectos evaluados y sentimiento a partir de comentarios de usuarios.
   */
  async extraerValoracionesResena(textoResena, apiKey = '') {
    const text = (textoResena || '').trim();
    if (!text) return [];

    const key = apiKey || this.getEffectiveKey();
    if (key) {
      try {
        const prompt = `Analiza la siguiente reseña gastronómica y extrae valoraciones por aspecto en formato JSON estricto.
Reseña: "${text}"

Responde ÚNICAMENTE con un array JSON de objetos con las propiedades:
- "aspecto": string (ej: "Comida", "Atención", "Precio", "Ambiente", "Opciones Sin TACC")
- "sentimiento": "Positivo" | "Neutro" | "Negativo"
- "detalle": string breve explicando el motivo`;

        const raw = await this.callAI(prompt, key, { temperature: 0.1, timeout: 5000 });
        if (raw) {
          const match = raw.match(/\[[\s\S]*\]/);
          if (match) return JSON.parse(match[0]);
        }
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

  async extraerValoraciones(textoResena, apiKey = '') {
    return this.extraerValoracionesResena(textoResena, apiKey);
  }
}

module.exports = new ServicioIA();
