/**
 * GastronomIA - Data Persistence Layer (SQLite + In-Memory/JSON fallback)
 * Implements 12 Entities:
 * 1. Usuario
 * 2. RestriccionAlimentaria
 * 3. UsuarioRestriccion
 * 4. Preferencia
 * 5. HistorialPreferencia
 * 6. Establecimiento
 * 7. EstablecimientoRestriccion (con nivel_informacion)
 * 8. Fuente
 * 9. EstablecimientoFuente
 * 10. Conversacion
 * 11. Mensaje
 * 12. Recomendacion
 * 13. Resena & Valoracion
 */

const fs = require('fs');
const path = require('path');

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const DB_FILE = isVercel
  ? path.join('/tmp', 'gastronomia_modular.db')
  : path.join(process.cwd(), 'gastronomia_modular.db');

// En Vercel serverless el directorio raíz es de solo lectura. Copiamos la base a /tmp si existe.
if (isVercel) {
  try {
    const sourceDb = path.join(process.cwd(), 'gastronomia_modular.db');
    if (fs.existsSync(sourceDb) && !fs.existsSync(DB_FILE)) {
      fs.copyFileSync(sourceDb, DB_FILE);
    }
  } catch (copyErr) {
    console.warn('[DB] Nota: inicializando base directamente en /tmp para Vercel:', copyErr.message);
  }
}

let db = null;
let useNativeSqlite = false;

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_FILE);
  useNativeSqlite = true;
  console.log('[DB] Conectado exitosamente con node:sqlite nativo' + (isVercel ? ' en /tmp' : ''));
} catch (err) {
  console.warn('[DB] node:sqlite no disponible, utilizando adaptador JSON sincronizado:', err.message);
  useNativeSqlite = false;
}

// -----------------------------------------------------------------------------
// SEED DATA: 18+ Establecimientos reales/realistas en CABA, Zona Norte, Sur y Oeste
// -----------------------------------------------------------------------------
const SEED_FUENTES = [
  { id: 1, nombre: 'Portal de Datos Abiertos GCBA', tipo: 'Oficial GCBA', url: 'https://data.buenosaires.gob.ar/' },
  { id: 2, nombre: 'OpenStreetMap Buenos Aires & GBA', tipo: 'Comunitario OSM', url: 'https://www.openstreetmap.org/' },
  { id: 3, nombre: 'Registro Oficial de Alimentos Libres de Gluten (ANMAT)', tipo: 'Regulatorio Nacional', url: 'https://www.argentina.gob.ar/anmat' },
  { id: 4, nombre: 'Directorio Gastronómico Municipal GBA', tipo: 'Oficial Municipal', url: 'https://gba.gob.ar/gastronomia' },
];

const SEED_RESTRICCIONES = [
  { id: 1, codigo: 'sin_tacc', nombre: 'Celíaco / Sin TACC', descripcion: 'Libre de gluten (trigo, avena, cebada, centeno)' },
  { id: 2, codigo: 'vegano', nombre: 'Vegano', descripcion: 'Sin ingredientes de origen animal (100% plant-based)' },
  { id: 3, codigo: 'vegetariano', nombre: 'Vegetariano', descripcion: 'Sin carne ni pescado; incluye lácteos y huevos' },
  { id: 4, codigo: 'sin_lactosa', nombre: 'Sin Lactosa', descripcion: 'Opciones sin lácteos o con enzimas deslactosadas' },
];

const SEED_ESTABLECIMIENTOS = [
  // CABA
  {
    id: 1,
    nombre: 'Don Julio Parrilla',
    descripcion: 'Reconocida parrilla porteña con carnes de pastura seleccionadas y una cava de vinos legendaria.',
    categoria: 'Parrilla',
    cocina: 'Parrilla Argentina',
    direccion: 'Guatemala 4699',
    barrio: 'Palermo',
    zona: 'CABA',
    latitud: -34.5888,
    longitud: -58.4239,
    telefono: '+54 11 4832-6058',
    website: 'https://www.parrilladonjulio.com',
    rango_precio: '$$$',
    ambiente: 'Elegante y Tradicional',
    imagen_url: '/zone_caba.jpg',
    activo: 1,
    por_que_recomendamos: 'Cortes premium madurados, vegetales a las brasas y un protocolo dedicado para carnes libres de gluten.'
  },
  {
    id: 2,
    nombre: 'Pizzería Güerrin',
    descripcion: 'Monumento culinario de la Calle Corrientes desde 1932. Pizza al molde en horno a leña.',
    categoria: 'Pizzería',
    cocina: 'Pizzería Porteña',
    direccion: 'Av. Corrientes 1368',
    barrio: 'San Nicolás',
    zona: 'CABA',
    latitud: -34.6042,
    longitud: -58.3862,
    telefono: '+54 11 4371-8141',
    website: 'https://pizzeriaguerrin.com',
    rango_precio: '$',
    ambiente: 'Popular y Animado',
    imagen_url: '/zone_caba.jpg',
    activo: 1,
    por_que_recomendamos: 'La fugazzetta rellena más emblemática de Buenos Aires, con excelente fainá y ritmo histórico porteño.'
  },
  {
    id: 3,
    nombre: 'Sarkis',
    descripcion: 'El gran clásico de comida armenia y del medio oriente. Porciones generosas para compartir en familia.',
    categoria: 'Restaurante',
    cocina: 'Armenia / Medio Oriente',
    direccion: 'Thames 1101',
    barrio: 'Villa Crespo',
    zona: 'CABA',
    latitud: -34.5912,
    longitud: -58.4371,
    telefono: '+54 11 4772-4911',
    website: 'https://instagram.com/sarkisrestaurante',
    rango_precio: '$$',
    ambiente: 'Familiar y Bullicioso',
    imagen_url: '/promo_food.jpg',
    activo: 1,
    por_que_recomendamos: 'Amplia variedad de mezze, hummus, falafel, ensaladas frescas y platos vegetarianos excepcionales.'
  },
  {
    id: 4,
    nombre: 'Sintaxis Sin TACC',
    descripcion: 'Pionero en Buenos Aires con cocina 100% libre de gluten certificada. Restaurante, café y almacén.',
    categoria: 'Restaurante',
    cocina: 'Casera y Gourmet',
    direccion: 'Nicaragua 4849',
    barrio: 'Palermo',
    zona: 'CABA',
    latitud: -34.5866,
    longitud: -58.4285,
    telefono: '+54 11 2071-2960',
    website: 'https://sintaxis.com.ar',
    rango_precio: '$$',
    ambiente: 'Cálido y Seguro',
    imagen_url: '/promo_food.jpg',
    activo: 1,
    por_que_recomendamos: 'Instalaciones 100% libres de gluten registradas en ANMAT. Platos de pastas, milanesas y pastelería sin riesgo de contaminación.'
  },
  {
    id: 5,
    nombre: 'Buenos Aires Verde',
    descripcion: 'Restaurante de cocina orgánica, vegetariana, vegana y raw food liderado por el chef Mauro Massimino.',
    categoria: 'Restaurante',
    cocina: 'Vegana / Orgánica',
    direccion: 'Gorriti 5657',
    barrio: 'Palermo',
    zona: 'CABA',
    latitud: -34.5828,
    longitud: -58.4385,
    telefono: '+54 11 4771-4000',
    website: 'https://bsasverde.com',
    rango_precio: '$$',
    ambiente: 'Tranquilo y Saludable',
    imagen_url: '/promo_food.jpg',
    activo: 1,
    por_que_recomendamos: 'Propuesta de cocina consciente con opciones veganas, sin lactosa y raw sin harinas refinadas.'
  },
  {
    id: 6,
    nombre: 'Cuervo Café Colegiales',
    descripcion: 'Cafetería de especialidad referente de la tercera ola porteña con tostado propio y bakery artesanal.',
    categoria: 'Cafetería',
    cocina: 'Cafetería de Especialidad',
    direccion: 'Newbery 3898',
    barrio: 'Colegiales',
    zona: 'CABA',
    latitud: -34.5855,
    longitud: -58.4512,
    telefono: '+54 11 4554-1234',
    website: 'https://cuervocafe.com',
    rango_precio: '$$',
    ambiente: 'Moderno y Relajado',
    imagen_url: '/promo_food.jpg',
    activo: 1,
    por_que_recomendamos: 'Café de orígenes seleccionados, leche vegetal, tostadas con masa madre y opciones sin gluten en pastelería.'
  },
  {
    id: 7,
    nombre: 'Bodegón El Obrero',
    descripcion: 'Bodegón histórico de La Boca fundado en 1954. Clásicas minutas, rabas y bifes de chorizo gigantes.',
    categoria: 'Bodegón',
    cocina: 'Porteña Tradicional',
    direccion: 'Agustín R. Caffarena 64',
    barrio: 'La Boca',
    zona: 'CABA',
    latitud: -34.6331,
    longitud: -58.3615,
    telefono: '+54 11 4362-9912',
    website: 'https://instagram.com/bodegonelobrero',
    rango_precio: '$$',
    ambiente: 'Rústico y Folclórico',
    imagen_url: '/zone_caba.jpg',
    activo: 1,
    por_que_recomendamos: 'Auténtica mística de bodegón obrero, porciones para compartir y atención cordial porteña.'
  },
  {
    id: 8,
    nombre: 'Cabaña Las Lilas',
    descripcion: 'Parrilla de alta gama en los docks de Puerto Madero con vista al río y cortes vacunos premium.',
    categoria: 'Parrilla',
    cocina: 'Parrilla Gourmet',
    direccion: 'Av. Alicia Moreau de Justo 516',
    barrio: 'Puerto Madero',
    zona: 'CABA',
    latitud: -34.6068,
    longitud: -58.3654,
    telefono: '+54 11 4313-1336',
    website: 'https://restaurantlaslilas.com.ar',
    rango_precio: '$$$',
    ambiente: 'Sofisticado y Panorámico',
    imagen_url: '/zone_caba.jpg',
    activo: 1,
    por_que_recomendamos: 'Atención internacional, carta de vinos premiada y cortes rigurosamente seleccionados.'
  },

  // ZONA NORTE (GBA)
  {
    id: 9,
    nombre: "Alo's Bistro",
    descripcion: 'Cocina de autor y producto estacional en San Isidro comandada por el chef Alejandro Féraud.',
    categoria: 'Restaurante',
    cocina: 'Autor / Estacional',
    direccion: 'Blanco Encalada 2120',
    barrio: 'Boulogne / San Isidro',
    zona: 'Zona Norte (GBA)',
    latitud: -34.4841,
    longitud: -58.5398,
    telefono: '+54 11 4737-0248',
    website: 'https://alos.com.ar',
    rango_precio: '$$$',
    ambiente: 'Gourmet e Íntimo',
    imagen_url: '/zone_norte.jpg',
    activo: 1,
    por_que_recomendamos: 'Cocina de estación con huerta propia, platos que adaptan técnicas para celíacos y vegetarianos.'
  },
  {
    id: 10,
    nombre: 'La Madriguera Café & Deli',
    descripcion: 'Acogedora cafetería de especialidad en Vicente López con opciones dedicadas sin TACC y brunch.',
    categoria: 'Cafetería',
    cocina: 'Cafetería y Brunch',
    direccion: 'Av. Maipú 1420',
    barrio: 'Vicente López',
    zona: 'Zona Norte (GBA)',
    latitud: -34.5298,
    longitud: -58.4764,
    telefono: '+54 11 4791-5522',
    website: 'https://instagram.com/lamadrigueracafe',
    rango_precio: '$',
    ambiente: 'Cálido y Luminoso',
    imagen_url: '/zone_norte.jpg',
    activo: 1,
    por_que_recomendamos: 'Excelente pastelería individual sellada sin TACC, leches de almendras y avena, ambiente de trabajo ideal.'
  },
  {
    id: 11,
    nombre: 'Parrilla La Choza',
    descripcion: 'Gran parrilla tradicional en San Isidro con amplio jardín arbolado y brasas a la vista.',
    categoria: 'Parrilla',
    cocina: 'Parrilla de Campo',
    direccion: 'Dardo Rocha 1200',
    barrio: 'San Isidro',
    zona: 'Zona Norte (GBA)',
    latitud: -34.4921,
    longitud: -58.5142,
    telefono: '+54 11 4792-3344',
    website: 'https://parrillalachoza.com.ar',
    rango_precio: '$$',
    ambiente: 'Familiar con Jardín',
    imagen_url: '/zone_norte.jpg',
    activo: 1,
    por_que_recomendamos: 'Espacios al aire libre sobre el hipódromo, carnes tiernas y opciones de guarniciones aptas celíacos.'
  },
  {
    id: 12,
    nombre: 'Pizzería Tano San Martín',
    descripcion: 'Pizzería de barrio emblemática en General San Martín, con media masa crocante y empanadas fritas.',
    categoria: 'Pizzería',
    cocina: 'Pizzería Tradicional',
    direccion: 'Belgrano 3450',
    barrio: 'San Martín',
    zona: 'Zona Norte (GBA)',
    latitud: -34.5752,
    longitud: -58.5412,
    telefono: '+54 11 4755-9876',
    website: 'https://pizzeriatano.com.ar',
    rango_precio: '$',
    ambiente: 'Barrial y Rápido',
    imagen_url: '/zone_norte.jpg',
    activo: 1,
    por_que_recomendamos: 'Precios sumamente accesibles, porciones abundantes y una fainá dorada premiada localmente.'
  },

  // ZONA SUR (GBA)
  {
    id: 13,
    nombre: 'Pertutti Avellaneda',
    descripcion: 'Histórico restaurante, confitería y salón familiar en el centro comercial de Avellaneda.',
    categoria: 'Restaurante',
    cocina: 'Internacional / Pastas',
    direccion: 'Av. Mitre 801',
    barrio: 'Avellaneda',
    zona: 'Zona Sur (GBA)',
    latitud: -34.6648,
    longitud: -58.3655,
    telefono: '+54 11 4222-1200',
    website: 'https://pertutti.com.ar',
    rango_precio: '$$',
    ambiente: 'Familiar y Clásico',
    imagen_url: '/zone_sur.jpg',
    activo: 1,
    por_que_recomendamos: 'Carta amplia con menú especial para celíacos con pastas y postres envasados al vacío.'
  },
  {
    id: 14,
    nombre: 'Bodegón El Ferroviario Sur',
    descripcion: 'Parrilla abundante y bodegón de platos gigantes en Lanús, frecuentado por familias del sur.',
    categoria: 'Bodegón',
    cocina: 'Bodegón y Parrilla',
    direccion: 'Av. Hipólito Yrigoyen 4100',
    barrio: 'Lanús Oeste',
    zona: 'Zona Sur (GBA)',
    latitud: -34.7045,
    longitud: -58.4055,
    telefono: '+54 11 4241-7788',
    website: 'https://instagram.com/elferroviariosur',
    rango_precio: '$$',
    ambiente: 'Festivo y Abundante',
    imagen_url: '/zone_sur.jpg',
    activo: 1,
    por_que_recomendamos: 'Milanesas colosales para cuatro personas, asado al corte y porciones para llevar.'
  },
  {
    id: 15,
    nombre: 'Lo de Carlitos Banfield',
    descripcion: 'El rey del panqueque con combinaciones dulces y saladas en pleno centro de Banfield.',
    categoria: 'Restaurante',
    cocina: 'Panqueques y Minutas',
    direccion: 'Alsina 850',
    barrio: 'Banfield',
    zona: 'Zona Sur (GBA)',
    latitud: -34.7435,
    longitud: -58.3925,
    telefono: '+54 11 4242-6633',
    website: 'https://lodecarlitos.com',
    rango_precio: '$',
    ambiente: 'Joven y Descontracturado',
    imagen_url: '/zone_sur.jpg',
    activo: 1,
    por_que_recomendamos: 'Opción de masa sin TACC para panqueques dulces y salados, hamburguesas y licuados naturales.'
  },

  // ZONA OESTE (GBA)
  {
    id: 16,
    nombre: 'La Cabaña de Ramos',
    descripcion: 'Asador criollo y carnes al espiedo en Ramos Mejía, un clásico del oeste para cenas familiares.',
    categoria: 'Parrilla',
    cocina: 'Parrilla Argentina',
    direccion: 'Av. de Mayo 650',
    barrio: 'Ramos Mejía',
    zona: 'Zona Oeste (GBA)',
    latitud: -34.6465,
    longitud: -58.5635,
    telefono: '+54 11 4658-9900',
    website: 'https://lacabanaderamos.com.ar',
    rango_precio: '$$',
    ambiente: 'Tradicional y Cálido',
    imagen_url: '/zone_oeste.jpg',
    activo: 1,
    por_que_recomendamos: 'Carnes a la parrilla con cocción perfecta, ensaladas completas y atención esmerada.'
  },
  {
    id: 17,
    nombre: 'Café Tokio & Brunch Morón',
    descripcion: 'Espacio moderno de cafetería de especialidad, pastelería artesanal y opciones veganas en Morón.',
    categoria: 'Cafetería',
    cocina: 'Café de Especialidad / Brunch',
    direccion: 'Nuestra Señora del Buen Viaje 740',
    barrio: 'Morón',
    zona: 'Zona Oeste (GBA)',
    latitud: -34.6525,
    longitud: -58.6215,
    telefono: '+54 11 4483-3311',
    website: 'https://instagram.com/tokiocafe.moron',
    rango_precio: '$',
    ambiente: 'Minimalista y Tranquilo',
    imagen_url: '/zone_oeste.jpg',
    activo: 1,
    por_que_recomendamos: 'Tostadas con palta y hongos, leches vegetales, budines veganos y cold brew refrescante.'
  },
  {
    id: 18,
    nombre: 'Il Vero Pastasciutta Ciudadela',
    descripcion: 'Rincón de pastas caseras italianas amasadas a mano y salsas tradicionales cocinadas a fuego lento.',
    categoria: 'Restaurante',
    cocina: 'Pastas Italianas',
    direccion: 'Av. Gaona 3920',
    barrio: 'Ciudadela',
    zona: 'Zona Oeste (GBA)',
    latitud: -34.6345,
    longitud: -58.5415,
    telefono: '+54 11 4653-2288',
    website: 'https://ilveropastasciutta.com.ar',
    rango_precio: '$$',
    ambiente: 'Familiar y Acogedor',
    imagen_url: '/zone_oeste.jpg',
    activo: 1,
    por_que_recomendamos: 'Ravioles de ricota y nuez, ñoquis de papa y variedad de salsas caseras con opción de pasta sin gluten.'
  }
];

// Vinculación Establecimiento-Restricción con nivel_informacion
const SEED_ESTABLECIMIENTO_RESTRICCIONES = [
  // Sintaxis: 100% libre de gluten certificada
  { establecimiento_id: 4, restriccion_id: 1, nivel_informacion: 'Cocina 100% libre de gluten certificada (ANMAT)' },
  { establecimiento_id: 4, restriccion_id: 4, nivel_informacion: 'Opciones dedicadas sin lactosa en carta' },
  // Buenos Aires Verde: Vegano, Vegetariano, Sin Lactosa
  { establecimiento_id: 5, restriccion_id: 2, nivel_informacion: 'Cocina 100% plant-based y vegana' },
  { establecimiento_id: 5, restriccion_id: 3, nivel_informacion: 'Menú integral vegetariano' },
  { establecimiento_id: 5, restriccion_id: 4, nivel_informacion: 'Libre de lácteos animales por concepto' },
  { establecimiento_id: 5, restriccion_id: 1, nivel_informacion: 'Opciones sin TACC manipuladas con cuidado' },
  // Don Julio: Sin TACC en carnes
  { establecimiento_id: 1, restriccion_id: 1, nivel_informacion: 'Carnes a la parrilla libres de gluten con parrilla sectorizada' },
  // Sarkis: Vegetariano y Vegano
  { establecimiento_id: 3, restriccion_id: 3, nivel_informacion: 'Amplia variedad de platos vegetarianos (falafel, ensaladas, mezze)' },
  { establecimiento_id: 3, restriccion_id: 2, nivel_informacion: 'Opciones veganas explícitas en carta (hummus, mutabal, tabule)' },
  // Cuervo Café
  { establecimiento_id: 6, restriccion_id: 4, nivel_informacion: 'Leches vegetales sin lactosa (almendras, avena)' },
  { establecimiento_id: 6, restriccion_id: 1, nivel_informacion: 'Pastelería empaquetada de origen sin gluten' },
  // Alo's Bistro
  { establecimiento_id: 9, restriccion_id: 1, nivel_informacion: 'Menú por pasos adaptable a celiaquía con aviso previo' },
  { establecimiento_id: 9, restriccion_id: 3, nivel_informacion: 'Menú por pasos vegetariano disponible' },
  // La Madriguera
  { establecimiento_id: 10, restriccion_id: 1, nivel_informacion: 'Opciones dedicadas sin TACC envasadas de fábrica' },
  { establecimiento_id: 10, restriccion_id: 4, nivel_informacion: 'Bebidas con leche vegetal disponible' },
  // Pertutti
  { establecimiento_id: 13, restriccion_id: 1, nivel_informacion: 'Carta celíaca con platos termo-sellados' },
  // Lo de Carlitos
  { establecimiento_id: 15, restriccion_id: 1, nivel_informacion: 'Masa de panqueques sin TACC preparada en plancha desinfectada' },
  // Café Tokio
  { establecimiento_id: 17, restriccion_id: 2, nivel_informacion: 'Pastelería vegana y bebidas vegetales' },
  // Il Vero
  { establecimiento_id: 18, restriccion_id: 1, nivel_informacion: 'Pastas secas y rellenas sin TACC cocidas en agua independiente' }
];

// Vinculación Establecimiento-Fuente
const SEED_ESTABLECIMIENTO_FUENTES = [
  { establecimiento_id: 1, fuente_id: 1, fecha_relevamiento: '2026-03-15', identificador_externo: 'BA-GASTRO-00104' },
  { establecimiento_id: 2, fuente_id: 2, fecha_relevamiento: '2026-04-10', identificador_externo: 'OSM-NODE-492102' },
  { establecimiento_id: 3, fuente_id: 1, fecha_relevamiento: '2026-02-20', identificador_externo: 'BA-GASTRO-00431' },
  { establecimiento_id: 4, fuente_id: 3, fecha_relevamiento: '2026-05-01', identificador_externo: 'ANMAT-CEL-2024-88' },
  { establecimiento_id: 5, fuente_id: 1, fecha_relevamiento: '2026-01-18', identificador_externo: 'BA-GASTRO-01290' },
  { establecimiento_id: 6, fuente_id: 2, fecha_relevamiento: '2026-04-22', identificador_externo: 'OSM-NODE-781903' },
  { establecimiento_id: 7, fuente_id: 1, fecha_relevamiento: '2026-03-05', identificador_externo: 'BA-GASTRO-00812' },
  { establecimiento_id: 8, fuente_id: 1, fecha_relevamiento: '2026-02-12', identificador_externo: 'BA-GASTRO-00215' },
  { establecimiento_id: 9, fuente_id: 4, fecha_relevamiento: '2026-04-02', identificador_externo: 'GBA-SI-0441' },
  { establecimiento_id: 10, fuente_id: 2, fecha_relevamiento: '2026-03-29', identificador_externo: 'OSM-NODE-990142' },
  { establecimiento_id: 11, fuente_id: 2, fecha_relevamiento: '2026-04-15', identificador_externo: 'OSM-NODE-552011' },
  { establecimiento_id: 12, fuente_id: 2, fecha_relevamiento: '2026-05-04', identificador_externo: 'OSM-NODE-331200' },
  { establecimiento_id: 13, fuente_id: 4, fecha_relevamiento: '2026-03-10', identificador_externo: 'GBA-AV-0112' },
  { establecimiento_id: 14, fuente_id: 4, fecha_relevamiento: '2026-02-28', identificador_externo: 'GBA-LA-0589' },
  { establecimiento_id: 15, fuente_id: 2, fecha_relevamiento: '2026-04-18', identificador_externo: 'OSM-NODE-612044' },
  { establecimiento_id: 16, fuente_id: 4, fecha_relevamiento: '2026-03-22', identificador_externo: 'GBA-LM-0771' },
  { establecimiento_id: 17, fuente_id: 2, fecha_relevamiento: '2026-04-25', identificador_externo: 'OSM-NODE-843210' },
  { establecimiento_id: 18, fuente_id: 2, fecha_relevamiento: '2026-05-02', identificador_externo: 'OSM-NODE-712998' }
];

// In-Memory store if sqlite native engine is not used or as fallback
const inMemoryStore = {
  usuarios: [
    {
      id: 1,
      nombre: 'Gastrónomo Porteño',
      email: 'usuario@gastronomia.ba',
      presupuesto_preferido: '$$',
      ambiente_preferido: 'Tranquilo y Cálido',
      cocina_favorita: 'Parrilla Argentina',
      creado_en: new Date().toISOString()
    }
  ],
  restricciones: SEED_RESTRICCIONES,
  usuario_restricciones: [
    { id: 1, usuario_id: 1, restriccion_id: 1 } // Sin TACC por defecto para testing de directivas
  ],
  preferencias: [
    { id: 1, usuario_id: 1, tipo: 'presupuesto', valor: '$$' },
    { id: 2, usuario_id: 1, tipo: 'ambiente', valor: 'Tranquilo y Cálido' },
    { id: 3, usuario_id: 1, tipo: 'cocina', valor: 'Parrilla Argentina' }
  ],
  historial_preferencias: [],
  establecimientos: SEED_ESTABLECIMIENTOS,
  establecimiento_restricciones: SEED_ESTABLECIMIENTO_RESTRICCIONES.map((r, i) => ({ id: i + 1, ...r })),
  fuentes: SEED_FUENTES,
  establecimiento_fuentes: SEED_ESTABLECIMIENTO_FUENTES.map((f, i) => ({ id: i + 1, ...f })),
  conversaciones: [
    { id: 1, usuario_id: 1, iniciada_en: new Date().toISOString(), actualizada_en: new Date().toISOString(), estado: 'activa' }
  ],
  mensajes: [],
  recomendaciones: [],
  resenas: [
    {
      id: 1,
      establecimiento_id: 4,
      usuario_id: 1,
      puntuacion: 5,
      comentario: 'Excelente lugar para comer sin preocuparse por el gluten. Las pastas rellenas son espectaculares y la atención muy cordial.',
      fecha: '2026-04-12'
    },
    {
      id: 2,
      establecimiento_id: 1,
      usuario_id: 1,
      puntuacion: 5,
      comentario: 'La mejor carne de Buenos Aires. Tienen protocolo impecable para celíacos en la parrilla.',
      fecha: '2026-04-18'
    }
  ],
  valoraciones: [
    { id: 1, resena_id: 1, aspecto: 'Comida sin TACC', sentimiento: 'Positivo', detalle: 'Pastas rellenas seguras y de gran sabor' },
    { id: 2, resena_id: 1, aspecto: 'Atención', sentimiento: 'Positivo', detalle: 'Personal capacitado y atento' },
    { id: 3, resena_id: 2, aspecto: 'Calidad de Carnes', sentimiento: 'Positivo', detalle: 'Punto de cocción perfecto' },
    { id: 4, resena_id: 2, aspecto: 'Protocolo Celíaco', sentimiento: 'Positivo', detalle: 'Sectorización impecable en parrilla' }
  ]
};

// -----------------------------------------------------------------------------
// INICIALIZACIÓN DE TABLAS EN SQLITE NATIVO
// -----------------------------------------------------------------------------
function initSqliteDatabase() {
  if (!useNativeSqlite || !db) return;

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE,
        presupuesto_preferido TEXT,
        ambiente_preferido TEXT,
        cocina_favorita TEXT,
        creado_en TEXT
      );

      CREATE TABLE IF NOT EXISTS restricciones_alimentarias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT
      );

      CREATE TABLE IF NOT EXISTS usuario_restricciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        restriccion_id INTEGER NOT NULL,
        UNIQUE(usuario_id, restriccion_id)
      );

      CREATE TABLE IF NOT EXISTS preferencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        valor TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS historial_preferencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo_cambio TEXT NOT NULL,
        valor_anterior TEXT,
        valor_nuevo TEXT,
        fecha TEXT
      );

      CREATE TABLE IF NOT EXISTS establecimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT NOT NULL,
        cocina TEXT,
        direccion TEXT,
        barrio TEXT NOT NULL,
        zona TEXT NOT NULL,
        latitud REAL,
        longitud REAL,
        telefono TEXT,
        website TEXT,
        rango_precio TEXT,
        ambiente TEXT,
        imagen_url TEXT,
        activo INTEGER DEFAULT 1,
        por_que_recomendamos TEXT
      );

      CREATE TABLE IF NOT EXISTS fuentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT,
        url TEXT
      );

      CREATE TABLE IF NOT EXISTS establecimiento_restricciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        establecimiento_id INTEGER NOT NULL,
        restriccion_id INTEGER NOT NULL,
        nivel_informacion TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS establecimiento_fuentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        establecimiento_id INTEGER NOT NULL,
        fuente_id INTEGER NOT NULL,
        fecha_relevamiento TEXT,
        identificador_externo TEXT
      );

      CREATE TABLE IF NOT EXISTS conversaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        iniciada_en TEXT,
        actualizada_en TEXT,
        estado TEXT DEFAULT 'activa'
      );

      CREATE TABLE IF NOT EXISTS mensajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversacion_id INTEGER NOT NULL,
        remitente TEXT NOT NULL,
        contenido TEXT NOT NULL,
        parametros_interpretados_json TEXT,
        creado_en TEXT
      );

      CREATE TABLE IF NOT EXISTS recomendaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mensaje_id INTEGER NOT NULL,
        establecimiento_id INTEGER NOT NULL,
        orden INTEGER,
        motivo_recomendacion TEXT
      );

      CREATE TABLE IF NOT EXISTS resenas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        establecimiento_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        puntuacion INTEGER NOT NULL,
        comentario TEXT,
        fecha TEXT
      );

      CREATE TABLE IF NOT EXISTS valoraciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resena_id INTEGER NOT NULL,
        aspecto TEXT NOT NULL,
        sentimiento TEXT NOT NULL,
        detalle TEXT
      );
    `);

    // Comprobar si ya existen registros en establecimientos
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM establecimientos');
    const row = checkStmt.get();
    if (!row || row.count === 0) {
      console.log('[DB] Inicializando semilla en base de datos SQLite...');
      // Poblar fuentes
      const insFuente = db.prepare('INSERT INTO fuentes (id, nombre, tipo, url) VALUES (?, ?, ?, ?)');
      SEED_FUENTES.forEach(f => insFuente.run(f.id, f.nombre, f.tipo, f.url));

      // Poblar restricciones
      const insRest = db.prepare('INSERT INTO restricciones_alimentarias (id, codigo, nombre, descripcion) VALUES (?, ?, ?, ?)');
      SEED_RESTRICCIONES.forEach(r => insRest.run(r.id, r.codigo, r.nombre, r.descripcion));

      // Poblar usuario
      const insUser = db.prepare('INSERT INTO usuarios (id, nombre, email, presupuesto_preferido, ambiente_preferido, cocina_favorita, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insUser.run(1, 'Gastrónomo Porteño', 'usuario@gastronomia.ba', '$$', 'Tranquilo y Cálido', 'Parrilla Argentina', new Date().toISOString());

      // Poblar usuario restricciones
      const insUserRest = db.prepare('INSERT INTO usuario_restricciones (usuario_id, restriccion_id) VALUES (?, ?)');
      insUserRest.run(1, 1);

      // Poblar establecimientos
      const insEst = db.prepare(`
        INSERT INTO establecimientos (
          id, nombre, descripcion, categoria, cocina, direccion, barrio, zona,
          latitud, longitud, telefono, website, rango_precio, ambiente, imagen_url, activo, por_que_recomendamos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      SEED_ESTABLECIMIENTOS.forEach(e => {
        insEst.run(
          e.id, e.nombre, e.descripcion, e.categoria, e.cocina, e.direccion, e.barrio, e.zona,
          e.latitud, e.longitud, e.telefono, e.website, e.rango_precio, e.ambiente, e.imagen_url, e.activo, e.por_que_recomendamos
        );
      });

      // Poblar establecimiento restricciones
      const insEstRest = db.prepare('INSERT INTO establecimiento_restricciones (establecimiento_id, restriccion_id, nivel_informacion) VALUES (?, ?, ?)');
      SEED_ESTABLECIMIENTO_RESTRICCIONES.forEach(er => insEstRest.run(er.establecimiento_id, er.restriccion_id, er.nivel_informacion));

      // Poblar establecimiento fuentes
      const insEstFte = db.prepare('INSERT INTO establecimiento_fuentes (establecimiento_id, fuente_id, fecha_relevamiento, identificador_externo) VALUES (?, ?, ?, ?)');
      SEED_ESTABLECIMIENTO_FUENTES.forEach(ef => insEstFte.run(ef.establecimiento_id, ef.fuente_id, ef.fecha_relevamiento, ef.identificador_externo));

      // Poblar conversacion inicial
      const insConv = db.prepare('INSERT INTO conversaciones (id, usuario_id, iniciada_en, actualizada_en, estado) VALUES (?, ?, ?, ?, ?)');
      insConv.run(1, 1, new Date().toISOString(), new Date().toISOString(), 'activa');

      console.log('[DB] Semilla completada exitosamente.');
    }
  } catch (err) {
    console.error('[DB] Error inicializando SQLite nativo:', err);
    useNativeSqlite = false;
  }
}

initSqliteDatabase();

// -----------------------------------------------------------------------------
// MÉTODOS DE LA CAPA DE PERSISTENCIA
// -----------------------------------------------------------------------------
const DataAccess = {
  // Establecimientos con búsqueda y filtros optimizados para el catálogo masivo (8.000+ locales)
  getEstablecimientos: (filtros = {}) => {
    if (!useNativeSqlite) {
      let list = inMemoryStore.establecimientos.filter(e => e.activo === 1);
      if (filtros.zona) {
        const zLow = filtros.zona.toLowerCase();
        list = list.filter(e => e.zona && e.zona.toLowerCase().includes(zLow));
      }
      if (filtros.cocina) {
        const cLow = filtros.cocina.toLowerCase();
        list = list.filter(e => (e.cocina && e.cocina.toLowerCase().includes(cLow)) || (e.categoria && e.categoria.toLowerCase().includes(cLow)));
      }
      return list;
    }

    const conditions = ['e.activo = 1'];
    const params = [];

    if (filtros.zona && filtros.zona !== 'Todas') {
      conditions.push('LOWER(e.zona) LIKE ?');
      params.push(`%${filtros.zona.toLowerCase()}%`);
    }

    if (filtros.barrio) {
      conditions.push('LOWER(e.barrio) LIKE ?');
      params.push(`%${filtros.barrio.toLowerCase()}%`);
    }

    if (filtros.cocina && filtros.cocina !== 'Todas') {
      conditions.push('(LOWER(e.cocina) LIKE ? OR LOWER(e.categoria) LIKE ?)');
      params.push(`%${filtros.cocina.toLowerCase()}%`, `%${filtros.cocina.toLowerCase()}%`);
    }

    if (filtros.presupuesto && filtros.presupuesto !== 'Todos') {
      conditions.push('e.rango_precio = ?');
      params.push(filtros.presupuesto);
    }

    if (filtros.ambiente) {
      conditions.push('LOWER(e.ambiente) LIKE ?');
      params.push(`%${filtros.ambiente.toLowerCase()}%`);
    }

    if (filtros.dieta) {
      conditions.push(`
        e.id IN (
          SELECT er.establecimiento_id 
          FROM establecimiento_restricciones er
          JOIN restricciones_alimentarias r ON er.restriccion_id = r.id
          WHERE LOWER(r.codigo) LIKE ? OR LOWER(r.nombre) LIKE ?
        )
      `);
      params.push(`%${filtros.dieta.toLowerCase()}%`, `%${filtros.dieta.toLowerCase()}%`);
    }

    if (filtros.query) {
      const q = `%${filtros.query.toLowerCase()}%`;
      conditions.push('(LOWER(e.nombre) LIKE ? OR LOWER(e.descripcion) LIKE ? OR LOWER(e.cocina) LIKE ? OR LOWER(e.barrio) LIKE ?)');
      params.push(q, q, q, q);
    }

    // Límite configurable: 1000 por defecto para fluidez total del mapa en el navegador
    const limit = filtros.limit ? parseInt(filtros.limit, 10) : 1000;
    const sql = `
      SELECT e.*, 
        (SELECT f.nombre FROM establecimiento_fuentes ef JOIN fuentes f ON ef.fuente_id = f.id WHERE ef.establecimiento_id = e.id LIMIT 1) as fuente_principal
      FROM establecimientos e
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.id ASC
      LIMIT ${limit}
    `;

    const list = db.prepare(sql).all(...params);

    if (list.length > 0) {
      const ids = list.map(x => x.id);
      const placeholders = ids.map(() => '?').join(',');
      const restRows = db.prepare(`
        SELECT er.establecimiento_id, r.id, r.codigo, r.nombre, r.descripcion, er.nivel_informacion
        FROM establecimiento_restricciones er
        JOIN restricciones_alimentarias r ON er.restriccion_id = r.id
        WHERE er.establecimiento_id IN (${placeholders})
      `).all(...ids);

      const restMap = {};
      for (const row of restRows) {
        if (!restMap[row.establecimiento_id]) restMap[row.establecimiento_id] = [];
        restMap[row.establecimiento_id].push({
          id: row.id,
          codigo: row.codigo,
          nombre: row.nombre,
          descripcion: row.descripcion,
          nivel_informacion: row.nivel_informacion
        });
      }

      for (const est of list) {
        est.restricciones = restMap[est.id] || [];
        est.fuentes = [{ nombre: est.fuente_principal || 'Datos Abiertos' }];
      }
    }

    return list;
  },

  getEstablecimientoById: (id) => {
    const numId = parseInt(id, 10);
    let est = null;
    if (useNativeSqlite) {
      est = db.prepare('SELECT * FROM establecimientos WHERE id = ?').get(numId);
    } else {
      est = inMemoryStore.establecimientos.find(e => e.id === numId);
    }

    if (!est) return null;

    // Obtener restricciones vinculadas con nivel_informacion
    let restricciones = [];
    if (useNativeSqlite) {
      const rows = db.prepare(`
        SELECT r.id, r.codigo, r.nombre, r.descripcion, er.nivel_informacion
        FROM establecimiento_restricciones er
        JOIN restricciones_alimentarias r ON er.restriccion_id = r.id
        WHERE er.establecimiento_id = ?
      `).all(numId);
      restricciones = rows;
    } else {
      const links = inMemoryStore.establecimiento_restricciones.filter(er => er.establecimiento_id === numId);
      restricciones = links.map(l => {
        const r = inMemoryStore.restricciones.find(x => x.id === l.restriccion_id);
        return { ...r, nivel_informacion: l.nivel_informacion };
      }).filter(Boolean);
    }

    // Obtener fuentes vinculadas
    let fuentes = [];
    if (useNativeSqlite) {
      const rows = db.prepare(`
        SELECT f.id, f.nombre, f.tipo, f.url, ef.fecha_relevamiento, ef.identificador_externo
        FROM establecimiento_fuentes ef
        JOIN fuentes f ON ef.fuente_id = f.id
        WHERE ef.establecimiento_id = ?
      `).all(numId);
      fuentes = rows;
    } else {
      const links = inMemoryStore.establecimiento_fuentes.filter(ef => ef.establecimiento_id === numId);
      fuentes = links.map(l => {
        const f = inMemoryStore.fuentes.find(x => x.id === l.fuente_id);
        return { ...f, fecha_relevamiento: l.fecha_relevamiento, identificador_externo: l.identificador_externo };
      }).filter(Boolean);
    }

    // Obtener reseñas y valoraciones
    let resenas = [];
    if (useNativeSqlite) {
      const rRows = db.prepare('SELECT * FROM resenas WHERE establecimiento_id = ? ORDER BY id DESC').all(numId);
      resenas = rRows.map(res => {
        const valRows = db.prepare('SELECT * FROM valoraciones WHERE resena_id = ?').all(res.id);
        return { ...res, valoraciones: valRows };
      });
    } else {
      resenas = inMemoryStore.resenas
        .filter(r => r.establecimiento_id === numId)
        .map(r => ({
          ...r,
          valoraciones: inMemoryStore.valoraciones.filter(v => v.resena_id === r.id)
        }));
    }

    return {
      ...est,
      restricciones,
      fuentes,
      resenas,
      fuente_principal: fuentes[0]?.nombre || 'Portal de Datos Abiertos GCBA'
    };
  },

  // Restricciones
  getRestricciones: () => {
    if (useNativeSqlite) {
      return db.prepare('SELECT * FROM restricciones_alimentarias').all();
    }
    return inMemoryStore.restricciones;
  },

  // Usuario
  getUsuario: (id = 1) => {
    const numId = parseInt(id, 10);
    let user = null;
    if (useNativeSqlite) {
      user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(numId);
    } else {
      user = inMemoryStore.usuarios.find(u => u.id === numId);
    }

    if (!user) return null;

    // Obtener restricciones activas del usuario
    let restricciones = [];
    if (useNativeSqlite) {
      const rows = db.prepare(`
        SELECT r.*
        FROM usuario_restricciones ur
        JOIN restricciones_alimentarias r ON ur.restriccion_id = r.id
        WHERE ur.usuario_id = ?
      `).all(numId);
      restricciones = rows;
    } else {
      const links = inMemoryStore.usuario_restricciones.filter(ur => ur.usuario_id === numId);
      restricciones = links.map(l => inMemoryStore.restricciones.find(r => r.id === l.restriccion_id)).filter(Boolean);
    }

    return {
      ...user,
      restricciones: restricciones.map(r => r.codigo)
    };
  },

  updateUsuario: (id, data) => {
    const numId = parseInt(id, 10);
    const existing = DataAccess.getUsuario(numId);
    if (!existing) return null;

    const nombre = data.nombre || existing.nombre;
    const presupuesto = data.presupuesto_preferido || existing.presupuesto_preferido;
    const ambiente = data.ambiente_preferido || existing.ambiente_preferido;
    const cocina = data.cocina_favorita || existing.cocina_favorita;

    if (useNativeSqlite) {
      db.prepare(`
        UPDATE usuarios 
        SET nombre = ?, presupuesto_preferido = ?, ambiente_preferido = ?, cocina_favorita = ?
        WHERE id = ?
      `).run(nombre, presupuesto, ambiente, cocina, numId);

      // Actualizar restricciones si vienen en data
      if (Array.isArray(data.restricciones)) {
        db.prepare('DELETE FROM usuario_restricciones WHERE usuario_id = ?').run(numId);
        const allRest = db.prepare('SELECT * FROM restricciones_alimentarias').all();
        const insStmt = db.prepare('INSERT INTO usuario_restricciones (usuario_id, restriccion_id) VALUES (?, ?)');
        for (const codigo of data.restricciones) {
          const match = allRest.find(r => r.codigo === codigo);
          if (match) insStmt.run(numId, match.id);
        }
      }
    } else {
      const idx = inMemoryStore.usuarios.findIndex(u => u.id === numId);
      inMemoryStore.usuarios[idx] = {
        ...inMemoryStore.usuarios[idx],
        nombre,
        presupuesto_preferido: presupuesto,
        ambiente_preferido: ambiente,
        cocina_favorita: cocina
      };

      if (Array.isArray(data.restricciones)) {
        inMemoryStore.usuario_restricciones = inMemoryStore.usuario_restricciones.filter(ur => ur.usuario_id !== numId);
        for (const codigo of data.restricciones) {
          const match = inMemoryStore.restricciones.find(r => r.codigo === codigo);
          if (match) {
            inMemoryStore.usuario_restricciones.push({
              id: Date.now() + Math.random(),
              usuario_id: numId,
              restriccion_id: match.id
            });
          }
        }
      }
    }

    return DataAccess.getUsuario(numId);
  },

  // Conversaciones y Mensajes
  getOrCreateConversacion: (usuarioId = 1) => {
    const uId = parseInt(usuarioId, 10);
    if (useNativeSqlite) {
      let conv = db.prepare("SELECT * FROM conversaciones WHERE usuario_id = ? AND estado = 'activa' ORDER BY id DESC LIMIT 1").get(uId);
      if (!conv) {
        const res = db.prepare('INSERT INTO conversaciones (usuario_id, iniciada_en, actualizada_en, estado) VALUES (?, ?, ?, ?)').run(
          uId, new Date().toISOString(), new Date().toISOString(), 'activa'
        );
        conv = { id: res.lastInsertRowid, usuario_id: uId, estado: 'activa' };
      }
      return conv;
    } else {
      let conv = inMemoryStore.conversaciones.find(c => c.usuario_id === uId && c.estado === 'activa');
      if (!conv) {
        conv = { id: inMemoryStore.conversaciones.length + 1, usuario_id: uId, iniciada_en: new Date().toISOString(), actualizada_en: new Date().toISOString(), estado: 'activa' };
        inMemoryStore.conversaciones.push(conv);
      }
      return conv;
    }
  },

  getMensajesConversacion: (conversacionId) => {
    const cId = parseInt(conversacionId, 10);
    if (useNativeSqlite) {
      const rows = db.prepare('SELECT * FROM mensajes WHERE conversacion_id = ? ORDER BY id ASC').all(cId);
      return rows.map(m => {
        let params = null;
        try { params = m.parametros_interpretados_json ? JSON.parse(m.parametros_interpretados_json) : null; } catch(e){}
        const recs = db.prepare(`
          SELECT r.*, e.nombre, e.barrio, e.zona, e.rango_precio, e.por_que_recomendamos, e.imagen_url
          FROM recomendaciones r
          JOIN establecimientos e ON r.establecimiento_id = e.id
          WHERE r.mensaje_id = ?
          ORDER BY r.orden ASC
        `).all(m.id);
        return {
          ...m,
          parametros_interpretados: params,
          recomendaciones: recs
        };
      });
    } else {
      return inMemoryStore.mensajes
        .filter(m => m.conversacion_id === cId)
        .map(m => ({
          ...m,
          recomendaciones: inMemoryStore.recomendaciones
            .filter(r => r.mensaje_id === m.id)
            .map(r => {
              const est = inMemoryStore.establecimientos.find(e => e.id === r.establecimiento_id);
              return { ...r, ...est };
            })
        }));
    }
  },

  guardarMensaje: (conversacionId, remitente, contenido, parametrosInterpretados = null) => {
    const cId = parseInt(conversacionId, 10);
    const paramStr = parametrosInterpretados ? JSON.stringify(parametrosInterpretados) : null;
    const now = new Date().toISOString();

    if (useNativeSqlite) {
      const res = db.prepare(`
        INSERT INTO mensajes (conversacion_id, remitente, contenido, parametros_interpretados_json, creado_en)
        VALUES (?, ?, ?, ?, ?)
      `).run(cId, remitente, contenido, paramStr, now);

      db.prepare('UPDATE conversaciones SET actualizada_en = ? WHERE id = ?').run(now, cId);
      return res.lastInsertRowid;
    } else {
      const id = inMemoryStore.mensajes.length + 1;
      inMemoryStore.mensajes.push({
        id,
        conversacion_id: cId,
        remitente,
        contenido,
        parametros_interpretados: parametrosInterpretados,
        creado_en: now
      });
      return id;
    }
  },

  guardarRecomendacion: (mensajeId, establecimientoId, orden, motivo) => {
    if (useNativeSqlite) {
      db.prepare(`
        INSERT INTO recomendaciones (mensaje_id, establecimiento_id, orden, motivo_recomendacion)
        VALUES (?, ?, ?, ?)
      `).run(mensajeId, establecimientoId, orden, motivo);
    } else {
      inMemoryStore.recomendaciones.push({
        id: inMemoryStore.recomendaciones.length + 1,
        mensaje_id: mensajeId,
        establecimiento_id: establecimientoId,
        orden,
        motivo_recomendacion: motivo
      });
    }
  },

  // Reseñas y Valoraciones
  crearResena: (establecimientoId, usuarioId, puntuacion, comentario, valoraciones = []) => {
    const estId = parseInt(establecimientoId, 10);
    const uId = parseInt(usuarioId, 10);
    const now = new Date().toISOString().split('T')[0];

    if (useNativeSqlite) {
      const res = db.prepare(`
        INSERT INTO resenas (establecimiento_id, usuario_id, puntuacion, comentario, fecha)
        VALUES (?, ?, ?, ?, ?)
      `).run(estId, uId, puntuacion, comentario, now);
      const resenaId = res.lastInsertRowid;

      const insVal = db.prepare('INSERT INTO valoraciones (resena_id, aspecto, sentimiento, detalle) VALUES (?, ?, ?, ?)');
      for (const v of valoraciones) {
        insVal.run(resenaId, v.aspecto || 'General', v.sentimiento || 'Positivo', v.detalle || '');
      }

      return resenaId;
    } else {
      const id = inMemoryStore.resenas.length + 1;
      inMemoryStore.resenas.push({
        id,
        establecimiento_id: estId,
        usuario_id: uId,
        puntuacion,
        comentario,
        fecha: now
      });

      for (const v of valoraciones) {
        inMemoryStore.valoraciones.push({
          id: inMemoryStore.valoraciones.length + 1,
          resena_id: id,
          aspecto: v.aspecto || 'General',
          sentimiento: v.sentimiento || 'Positivo',
          detalle: v.detalle || ''
        });
      }
      return id;
    }
  }
};

module.exports = DataAccess;
module.exports.SEED_ESTABLECIMIENTOS = SEED_ESTABLECIMIENTOS;
module.exports.SEED_ESTABLECIMIENTO_RESTRICCIONES = SEED_ESTABLECIMIENTO_RESTRICCIONES;
module.exports.SEED_ESTABLECIMIENTO_FUENTES = SEED_ESTABLECIMIENTO_FUENTES;
module.exports.SEED_FUENTES = SEED_FUENTES;
module.exports.SEED_RESTRICCIONES = SEED_RESTRICCIONES;
