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

const BARRIOS_CANONICOS = {
  // Centro y Congreso
  'congreso': { barrio: 'Congreso', zona: 'CABA', relacionados: ['Balvanera', 'San Nicolás', 'Monserrat'] },
  'balvanera': { barrio: 'Balvanera', zona: 'CABA', relacionados: ['Congreso', 'San Nicolás', 'Almagro'] },
  'once': { barrio: 'Balvanera', zona: 'CABA', relacionados: ['Congreso', 'Almagro'] },
  'abasto': { barrio: 'Balvanera', zona: 'CABA', relacionados: ['Almagro', 'Villa Crespo'] },
  'monserrat': { barrio: 'Monserrat', zona: 'CABA', relacionados: ['San Nicolás', 'San Telmo', 'Balvanera'] },
  'san nicolas': { barrio: 'San Nicolás', zona: 'CABA', relacionados: ['Monserrat', 'Retiro', 'Balvanera'] },
  'san nicolás': { barrio: 'San Nicolás', zona: 'CABA', relacionados: ['Monserrat', 'Retiro', 'Balvanera'] },
  'tribunales': { barrio: 'San Nicolás', zona: 'CABA', relacionados: ['Recoleta', 'Balvanera'] },
  'microcentro': { barrio: 'San Nicolás', zona: 'CABA', relacionados: ['Monserrat', 'Retiro'] },
  'centro': { barrio: 'San Nicolás', zona: 'CABA', relacionados: ['Monserrat', 'Retiro'] },
  'san telmo': { barrio: 'San Telmo', zona: 'CABA', relacionados: ['Monserrat', 'La Boca', 'Constitución'] },
  'la boca': { barrio: 'La Boca', zona: 'CABA', relacionados: ['San Telmo', 'Barracas'] },
  'puerto madero': { barrio: 'Puerto Madero', zona: 'CABA', relacionados: ['San Telmo', 'Retiro'] },
  'retiro': { barrio: 'Retiro', zona: 'CABA', relacionados: ['Recoleta', 'San Nicolás'] },
  'recoleta': { barrio: 'Recoleta', zona: 'CABA', relacionados: ['Retiro', 'Palermo'] },
  'palermo': { barrio: 'Palermo', zona: 'CABA', relacionados: ['Recoleta', 'Belgrano', 'Villa Crespo'] },
  'palermo soho': { barrio: 'Palermo', zona: 'CABA', relacionados: ['Palermo Hollywood', 'Villa Crespo'] },
  'palermo hollywood': { barrio: 'Palermo', zona: 'CABA', relacionados: ['Palermo Soho', 'Colegiales'] },
  'belgrano': { barrio: 'Belgrano', zona: 'CABA', relacionados: ['Núñez', 'Colegiales', 'Palermo'] },
  'nuñez': { barrio: 'Núñez', zona: 'CABA', relacionados: ['Belgrano', 'Saavedra'] },
  'núñez': { barrio: 'Núñez', zona: 'CABA', relacionados: ['Belgrano', 'Saavedra'] },
  'saavedra': { barrio: 'Saavedra', zona: 'CABA', relacionados: ['Núñez', 'Coghlan'] },
  'coghlan': { barrio: 'Coghlan', zona: 'CABA', relacionados: ['Belgrano', 'Villa Urquiza'] },
  'villa urquiza': { barrio: 'Villa Urquiza', zona: 'CABA', relacionados: ['Coghlan', 'Belgrano'] },
  'villa devoto': { barrio: 'Villa Devoto', zona: 'CABA', relacionados: ['Villa del Parque', 'Villa Pueyrredón'] },
  'villa del parque': { barrio: 'Villa del Parque', zona: 'CABA', relacionados: ['Villa Devoto', 'Caballito'] },
  'colegiales': { barrio: 'Colegiales', zona: 'CABA', relacionados: ['Palermo', 'Chacarita'] },
  'chacarita': { barrio: 'Chacarita', zona: 'CABA', relacionados: ['Colegiales', 'Villa Crespo'] },
  'villa crespo': { barrio: 'Villa Crespo', zona: 'CABA', relacionados: ['Palermo', 'Almagro'] },
  'almagro': { barrio: 'Almagro', zona: 'CABA', relacionados: ['Caballito', 'Balvanera'] },
  'caballito': { barrio: 'Caballito', zona: 'CABA', relacionados: ['Almagro', 'Flores'] },
  'boedo': { barrio: 'Boedo', zona: 'CABA', relacionados: ['Almagro', 'San Cristóbal'] },
  'san cristobal': { barrio: 'San Cristóbal', zona: 'CABA', relacionados: ['Balvanera', 'Boedo'] },
  'san cristóbal': { barrio: 'San Cristóbal', zona: 'CABA', relacionados: ['Balvanera', 'Boedo'] },
  'barracas': { barrio: 'Barracas', zona: 'CABA', relacionados: ['La Boca', 'Parque Patricios'] },
  'parque patricios': { barrio: 'Parque Patricios', zona: 'CABA', relacionados: ['Boedo', 'Barracas'] },
  'flores': { barrio: 'Flores', zona: 'CABA', relacionados: ['Caballito', 'Floresta'] },
  'floresta': { barrio: 'Floresta', zona: 'CABA', relacionados: ['Flores', 'Villa Luro'] },
  'liniers': { barrio: 'Liniers', zona: 'CABA', relacionados: ['Mataderos', 'Villa Luro'] },
  'mataderos': { barrio: 'Mataderos', zona: 'CABA', relacionados: ['Liniers', 'Parque Avellaneda'] },
  // GBA Norte
  'san isidro': { barrio: 'San Isidro', zona: 'Zona Norte (GBA)', relacionados: ['Martínez', 'Acassuso'] },
  'martinez': { barrio: 'Martínez', zona: 'Zona Norte (GBA)', relacionados: ['San Isidro', 'Olivos'] },
  'martínez': { barrio: 'Martínez', zona: 'Zona Norte (GBA)', relacionados: ['San Isidro', 'Olivos'] },
  'vicente lopez': { barrio: 'Vicente López', zona: 'Zona Norte (GBA)', relacionados: ['Olivos', 'Florida'] },
  'vicente lópez': { barrio: 'Vicente López', zona: 'Zona Norte (GBA)', relacionados: ['Olivos', 'Florida'] },
  'olivos': { barrio: 'Olivos', zona: 'Zona Norte (GBA)', relacionados: ['Vicente López', 'La Lucila'] },
  'san martin': { barrio: 'San Martín', zona: 'Zona Norte (GBA)', relacionados: ['Villa Ballester'] },
  'san martín': { barrio: 'San Martín', zona: 'Zona Norte (GBA)', relacionados: ['Villa Ballester'] },
  'tigre': { barrio: 'Tigre', zona: 'Zona Norte (GBA)', relacionados: ['San Fernando'] },
  // GBA Sur
  'avellaneda': { barrio: 'Avellaneda', zona: 'Zona Sur (GBA)', relacionados: ['Lanús'] },
  'lanus': { barrio: 'Lanús', zona: 'Zona Sur (GBA)', relacionados: ['Avellaneda', 'Banfield'] },
  'lanús': { barrio: 'Lanús', zona: 'Zona Sur (GBA)', relacionados: ['Avellaneda', 'Banfield'] },
  'banfield': { barrio: 'Banfield', zona: 'Zona Sur (GBA)', relacionados: ['Lanús', 'Lomas de Zamora'] },
  'quilmes': { barrio: 'Quilmes', zona: 'Zona Sur (GBA)', relacionados: ['Bernal'] },
  // GBA Oeste
  'ramos mejia': { barrio: 'Ramos Mejía', zona: 'Zona Oeste (GBA)', relacionados: ['Haedo', 'Ciudadela'] },
  'ramos mejía': { barrio: 'Ramos Mejía', zona: 'Zona Oeste (GBA)', relacionados: ['Haedo', 'Ciudadela'] },
  'moron': { barrio: 'Morón', zona: 'Zona Oeste (GBA)', relacionados: ['Castelar', 'Haedo'] },
  'morón': { barrio: 'Morón', zona: 'Zona Oeste (GBA)', relacionados: ['Castelar', 'Haedo'] },
  'ciudadela': { barrio: 'Ciudadela', zona: 'Zona Oeste (GBA)', relacionados: ['Ramos Mejía'] }
};

const ZONAS_CANONICAS = {
  'caba': 'CABA',
  'capital': 'CABA',
  'buenos aires': 'CABA',
  'congreso': 'CABA',
  'balvanera': 'CABA',
  'monserrat': 'CABA',
  'san nicolas': 'CABA',
  'san nicolás': 'CABA',
  'palermo': 'CABA',
  'recoleta': 'CABA',
  'san telmo': 'CABA',
  'belgrano': 'CABA',
  'villa crespo': 'CABA',
  'colegiales': 'CABA',
  'la boca': 'CABA',
  'puerto madero': 'CABA',
  'caballito': 'CABA',
  'almagro': 'CABA',
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
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
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
      'gemini-3-flash-preview',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite'
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
          signal: AbortSignal.timeout(options.timeout || 12000)
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
        const prompt = `Actúa como el motor NLP de GastronomIA para Buenos Aires y GBA. Analiza la consulta del comensal y extrae criterios en formato JSON estricto.
Consulta: "${text}"
Contexto previo: ${JSON.stringify(contexto)}

Instrucciones de normalización:
- "barrio": Si menciona un barrio o zona de CABA/GBA (ej: "Congreso", "San Nicolás", "Balvanera", "Palermo", "Recoleta", "San Telmo", "Belgrano", "Caballito", "Almagro", "San Isidro", etc.), extraelo tal cual.
- "zona": "CABA", "Zona Norte (GBA)", "Zona Sur (GBA)" o "Zona Oeste (GBA)". (Lugares como Congreso pertenecen a "CABA").
- "tipo_cocina": Normalizalo a una de estas categorías si aplica: "Cervecería / Bar" (para cervecería, birrería, bar, pub, birra, cerveza, tragos), "Parrilla", "Pizzería", "Pastas", "Cafetería", "Hamburguesería", "Bodegón", "Sushi & Asiática", "Armenia / Medio Oriente", "Vegana", "Heladería", o null si no especifica.
- "rango_precio": "$" | "$$" | "$$$" o null.
- "ambiente": "Tranquilo", "Familiar", "Romántico", "Aire libre", "Animado" o null.
- "restricciones": array ("sin_tacc", "vegano", "vegetariano", "sin_lactosa").

Responde ÚNICAMENTE con el JSON:
{
  "zona": string o null,
  "barrio": string o null,
  "tipo_cocina": string o null,
  "rango_precio": string o null,
  "ambiente": string o null,
  "restricciones": array,
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

            // Enriquecer con información canónica de barrio si fue detectado
            if (parsed.barrio) {
              const bLow = parsed.barrio.toLowerCase();
              if (BARRIOS_CANONICOS[bLow]) {
                parsed.barrioInfo = BARRIOS_CANONICOS[bLow];
                if (!parsed.zona) parsed.zona = BARRIOS_CANONICOS[bLow].zona;
              }
            }
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
      barrio: null,
      barrioInfo: null,
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

    // Separar restricciones explícitamente pedidas en la consulta de las del perfil
    result.restricciones_explicitadas = [];
    result.restricciones_perfil = [];

    if (contexto?.perfilUsuario?.restricciones && Array.isArray(contexto.perfilUsuario.restricciones)) {
      result.restricciones_perfil = [...contexto.perfilUsuario.restricciones];
    }

    // Detectar restricciones explícitas en el texto de la consulta
    if (/sin\s*tacc|celiac|gluten|trigo/i.test(lower)) {
      result.restricciones_explicitadas.push('sin_tacc');
    }
    if (/vegano|vegana|plant\s*based/i.test(lower)) {
      result.restricciones_explicitadas.push('vegano');
    }
    if (/vegetariano|vegetariana|veggie/i.test(lower)) {
      result.restricciones_explicitadas.push('vegetariano');
    }
    if (/sin\s*lactosa|deslactosad/i.test(lower)) {
      result.restricciones_explicitadas.push('sin_lactosa');
    }

    // result.restricciones combina explicitadas y de perfil para información del comensal
    result.restricciones = [...new Set([...result.restricciones_explicitadas, ...result.restricciones_perfil])];

    // Detectar barrio específico y zona correspondiente
    for (const [k, v] of Object.entries(BARRIOS_CANONICOS)) {
      const rx = new RegExp(`\\b${k}\\b`, 'i');
      if (rx.test(lower)) {
        result.barrio = v.barrio;
        result.zona = v.zona;
        result.barrioInfo = v;
        break;
      }
    }

    // Si no encontró barrio específico, buscar zona genérica
    if (!result.zona) {
      for (const [k, v] of Object.entries(ZONAS_CANONICAS)) {
        const rx = new RegExp(`\\b${k}\\b`, 'i');
        if (rx.test(lower)) {
          result.zona = v;
          break;
        }
      }
    }

    // Detectar cocina / categoría con cobertura amplia (cervecería, bar, birra, parrilladas, etc.)
    if (/cervec|cervez|birr|bar\b|pubs?\b|tragos|pinta|after/i.test(lower)) result.tipo_cocina = 'Cervecería / Bar';
    else if (/parrilla|asado|carne|bife|achura|ojo de bife|vacio|vacío/i.test(lower)) result.tipo_cocina = 'Parrilla';
    else if (/pizza|pizzería|pizzeria|fugazzetta|fugazzeta|empanada/i.test(lower)) result.tipo_cocina = 'Pizzería';
    else if (/pasta|pastas|ravioles|ñoquis|fideos|lasagna|italiana/i.test(lower)) result.tipo_cocina = 'Pastas';
    else if (/cafe|café|cafeteria|cafetería|merienda|desayuno|brunch|bakery/i.test(lower)) result.tipo_cocina = 'Cafetería';
    else if (/hamburgues|burger|fast food|comida rapida|lomito/i.test(lower)) result.tipo_cocina = 'Hamburguesería';
    else if (/bodegon|bodegón|bodegones|milanesa|milanesas|minuta|minutas/i.test(lower)) result.tipo_cocina = 'Bodegón';
    else if (/sushi|ramen|asiatica|asiática|japones|coreano/i.test(lower)) result.tipo_cocina = 'Sushi & Asiática';
    else if (/arabe|armenia|medio oriente|falafel/i.test(lower)) result.tipo_cocina = 'Armenia / Medio Oriente';
    else if (/vegan|vegetal|veggie/i.test(lower)) result.tipo_cocina = 'Vegana';
    else if (/helad/i.test(lower)) result.tipo_cocina = 'Heladería';

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
    const historial = Array.isArray(contexto.historial) ? contexto.historial : [];
    // Solo es continuación si el usuario ya envió al menos un mensaje previo en esta sesión
    const mensajesPreviosUsuario = historial.filter(m => m.remitente === 'usuario' || m.remitente === 'user');
    const esContinuacion = mensajesPreviosUsuario.length > 0;

    // Si la intención es puramente conversacional (ej. "¿cómo estás?", "hola foody")
    if (parametros?.es_conversacional_puro) {
      if (key) {
        try {
          const prompt = `Sos Foody, el asistente gastronómico amigable y experto de Buenos Aires (GastronomIA).
El usuario te dice: "${consulta}".
Nombre del comensal: ${perfilUsuario?.nombre || 'usuario'}.
¿Es el primer saludo del usuario o ya estaban en diálogo?: ${esContinuacion ? 'Ya estaban dialogando' : 'Es el primer saludo del usuario'}.

Pautas de tono y estilo estrictas:
- Español latino de Argentina natural, educado, empático y cordial (usá voseo estándar natural: "¿cómo estás?", "podés", "tenés", "te recomiendo", "contame").
- NUNCA uses lunfardo ni modismos exagerados (PROHIBIDO usar: "maestro", "capo", "morfi", "bajón", "de una", "alto...", "che", "tirar letra", "al toque", "te copa").
${esContinuacion
  ? '- Como ya están conversando en esta sesión, respondé de forma directa y cálida, sin volver a presentarte ni a decir "¿cómo estás?" ni "¡Hola [Nombre]!".'
  : '- Como es el PRIMER mensaje del usuario, saludalo con calidez: "¡Hola, ' + (perfilUsuario?.nombre || '') + '! ¿Cómo estás? Soy Foody..." o "¡Qué lindo saludarte!", y preguntale qué tiene ganas de comer hoy en CABA o GBA.'}
- NUNCA digas "Qué bueno seguir charlando" en el primer mensaje de saludo.`;
          const reply = await this.callAI(prompt, key, { temperature: 0.5, timeout: 8000 });
          if (reply) return reply;
        } catch (err) {
          console.warn('[ServicioIA] Error en saludo con IA:', err.message);
        }
      }
      return this._generarRespuestaSaludo(consulta, parametros.tipo_intencion, perfilUsuario, esContinuacion);
    }

    // Si hay una clave activa, generamos respuesta neuronal integrada con los locales reales
    if (key) {
      try {
        const historialTexto = historial.length > 0
          ? `\nHistorial reciente del diálogo:\n` +
            historial.slice(-4).map(h => `${h.remitente === 'usuario' ? 'Comensal' : 'Foody'}: ${h.contenido || h.respuesta || ''}`).join('\n') +
            '\n'
          : '';

        const prompt = `Sos Foody, el asistente gastronómico amigable, conocedor y empático de Buenos Aires (GastronomIA).
${historialTexto}Consulta actual del comensal: "${consulta}"

Resultados validados de la base de datos oficial (ELEGÍ EXCLUSIVAMENTE DE ESTA LISTA):
${JSON.stringify(resultados.map(r => ({
  nombre: r.nombre,
  barrio: r.barrio,
  zona: r.zona,
  cocina: r.cocina,
  precio: r.rango_precio,
  motivo: r.por_que_recomendamos,
  fuente: r.fuente_principal || 'Datos Abiertos'
})))}

REGLA MANDATORIA DE ELECCIÓN DE LOCALES:
Tus recomendaciones destacadas (2 o 3 locales) DEBEN ser elegidas ÚNICA Y EXCLUSIVAMENTE de los "Resultados validados de la base de datos oficial" provistos arriba. Está ESTRICTAMENTE PROHIBIDO mencionar o inventar locales que no estén en esa lista.

Perfil y preferencias del comensal:
- Nombre: ${perfilUsuario?.nombre || 'Comensal'}
- Restricciones: ${Array.isArray(perfilUsuario?.restricciones) && perfilUsuario.restricciones.length > 0 ? perfilUsuario.restricciones.join(', ') : 'Sin restricciones declaradas'}
- Zona preferida: ${perfilUsuario?.zona || perfilUsuario?.zona_preferida || 'CABA / GBA'}
- Presupuesto: ${perfilUsuario?.presupuesto_preferido || perfilUsuario?.presupuesto || '$$'}

Pautas de tono, estilo y fluidez conversacional estrictas:
1. Español latino de Argentina natural, cordial, empático y profesional (voseo estándar educado: "podés", "tenés", "te recomiendo", "si buscás").
2. NUNCA uses lunfardo ni modismos exagerados (PROHIBIDO usar: "maestro", "capo", "morfi", "bajón", "de una", "alto...", "che", "tirar letra", "al toque", "te copa", "desborda el plato").
3. REGLA ESTRICTA DE SALUDOS:
   ${esContinuacion
     ? '- La conversación YA ESTÁ EN CURSO. Está ESTRICTAMENTE PROHIBIDO volver a saludar, decir "¡Hola [Nombre]!", dar la bienvenida o decir "¿cómo estás?". Respondé DIRECTAMENTE y al grano sobre lo que consulta el comensal de forma fluida y natural (por ejemplo si pregunta si son económicos, arrancá directo hablando de los precios y de las opciones accesibles).'
     : '- Si es la primera interacción y el comensal te saludó, podés saludarlo cordialmente llamándolo por su nombre una sola vez.'}
4. FORMATO VISUAL CLARO:
   - Presentá de 2 a 3 opciones destacadas.
   - Dejá un SALTO DE LÍNEA doble entre cada restaurante para que se lea cómodamente y no quede todo apretado en un solo párrafo.
   - Destacá el nombre del local en negrita: ej. **1. Los Inmortales** (Recoleta, $).
5. REGLA ESTRICTA DE FUENTES (LIMPIEZA CONVERSACIONAL):
   - NUNCA pongas citas como "(Fuente: OpenStreetMap Buenos Aires & GBA)" o "(Fuente: Portal de Datos Abiertos GCBA)" al lado de los nombres ni dentro del texto descriptivo. Eso ensucia la charla y parece una base de datos.
   - Hablá de los lugares con naturalidad, recomendando qué comer o destacando su especialidad como un foodie local.
   - Al final de todo el mensaje, en una línea aparte como nota al pie sutil, podés colocar: "*(Datos oficiales validados de GCBA y OpenStreetMap)*".
6. PREGUNTA DE CIERRE:
   - Hacé una pregunta de cierre breve y cordial para orientar el siguiente paso.
7. SEGURIDAD ALIMENTARIA:
   - Si hay restricciones alimentarias (especialmente celiaquía/sin TACC), recordá consultar con el establecimiento sobre la manipulación y contaminación cruzada.`;

        const replyText = await this.callAI(prompt, key, { temperature: 0.5, timeout: 12000 });
        if (replyText) return replyText;
      } catch (err) {
        console.warn('[ServicioIA] Error generando respuesta con LLM, usando fallback local:', err.message);
      }
    }

    // FALLBACK DETERMINÍSTICO HUMANO
    return this._fallbackGenerarRespuesta(consulta, resultados, perfilUsuario, parametros, esContinuacion);
  }

  _generarRespuestaSaludo(consulta, tipo, perfilUsuario, esContinuacion = false) {
    const nombre = perfilUsuario?.nombre ? ` ${perfilUsuario.nombre}` : '';

    if (tipo === 'thanks') {
      return `¡De nada${nombre}! 😊 Con gusto. Si querés que busquemos otro lugar, armemos una ruta gastronómica o encuentres opciones especiales, avisame cuando quieras. 🍽️`;
    }

    if (tipo === 'farewell') {
      return `¡Hasta luego${nombre}! Que disfrutes mucho de tu experiencia gastronómica. Cuando quieras volver a buscar, acá estoy. ¡Buen provecho! 👋`;
    }

    if (tipo === 'identity') {
      return `¡Hola! Soy **Foody**, tu asistente gastronómico para **Buenos Aires y Gran Buenos Aires** 👨‍🍳\n\n` +
             `Estoy para ayudarte a encontrar los mejores lugares para comer según tus preferencias, presupuesto y ubicación.\n\n` +
             `¿En qué te puedo ayudar hoy?\n` +
             `• Restaurantes tradicionales, parrillas y bodegones\n` +
             `• Opciones certificadas **Sin TACC**, vegetarianas o veganas\n` +
             `• Cafeterías de especialidad tranquilas para merendar o trabajar\n` +
             `• Recomendaciones por barrio en CABA o zonas de GBA\n\n` +
             `Contame qué estás buscando y con gusto te sugiero los mejores lugares.`;
    }

    if (esContinuacion) {
      return `¡Decime${nombre}! ¿En qué te puedo ayudar o qué se te antoja buscar ahora?`;
    }

    // Saludo estándar inicial
    return `¡Hola${nombre}! ¿Cómo estás? Soy **Foody**, tu asistente de GastronomIA 👨‍🍳\n\n` +
           `Estoy acá para recomendarte excelentes propuestas gastronómicas en CABA y Gran Buenos Aires.\n\n` +
           `¿Qué tenés ganas de comer hoy? Contame qué se te antoja o qué zona querés explorar.`;
  }

  _fallbackGenerarRespuesta(consulta, resultados, perfilUsuario, parametros = {}, esContinuacion = false) {
    if (!resultados || resultados.length === 0) {
      return esContinuacion
        ? `Estuve buscando pero no encontré opciones que coincidan exactamente con esos filtros combinados. Si querés, podemos probar con un barrio vecino o ampliando un poco el rango de precio. ¿Qué decís?`
        : `¡Hola! Estuve buscando en nuestros registros pero no encontré opciones que coincidan justo con todos esos criterios. ¿Te gustaría que busquemos en alguna zona cercana o con otro estilo de comida?`;
    }

    const tieneRestriccion = (parametros.restricciones && parametros.restricciones.length > 0) ||
      resultados.some(r => r.restricciones && r.restricciones.length > 0);

    const nombre = perfilUsuario?.nombre ? ` ${perfilUsuario.nombre}` : '';
    const qLower = (consulta || '').toLowerCase();

    let intro = '';
    if (qLower.includes('economic') || qLower.includes('barat') || qLower.includes('precio') || qLower.includes('$')) {
      intro = esContinuacion
        ? `Si querés cuidar el bolsillo y comer rico, estas opciones tienen excelente relación precio-calidad:\n\n`
        : `¡Hola${nombre}! Si buscás opciones accesibles y ricas, estas propuestas son ideales:\n\n`;
    } else if (esContinuacion) {
      intro = `Acá tenés algunas muy buenas opciones que se adaptan justo a lo que me consultás:\n\n`;
    } else {
      intro = `¡Hola${nombre}! Te seleccioné estas propuestas ideales para lo que estás buscando:\n\n`;
    }

    const items = resultados.slice(0, 3).map((r, i) => {
      const barrioZona = r.barrio ? `${r.barrio}` : r.zona;
      const precioTag = r.rango_precio ? ` (${r.rango_precio})` : '';
      const motivo = r.por_que_recomendamos || r.descripcion || 'Excelente lugar para disfrutar buena comida.';
      const direccion = r.direccion ? ` Queda en ${r.direccion}.` : '';

      return `${i + 1}. **${r.nombre}** — *${barrioZona}*${precioTag}\n${motivo}${direccion}`;
    }).join('\n\n');

    let cierre = `\n\n¿Te tienta alguna de estas opciones o preferís que veamos alguna otra alternativa?`;

    if (tieneRestriccion) {
      cierre += `\n\n⚠️ **Aviso de Seguridad:** Aunque estos locales cuentan con opciones aptas, recordá consultar siempre al llegar sobre los cuidados contra contaminación cruzada.`;
    }

    cierre += `\n\n*(Datos oficiales validados de GCBA y OpenStreetMap)*`;

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
