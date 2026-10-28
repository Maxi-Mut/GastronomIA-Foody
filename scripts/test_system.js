/**
 * GastronomIA - Automated System & Integration Test Suite
 * Tests 4 Layers, 12 Entities, 8-Stage Flow, and Anti-Hallucination Guardrails
 */

const assert = require('assert');
const DataAccess = require('../lib/db');
const servicioIA = require('../lib/servicioIA');
const backendOrquestador = require('../lib/backendOrquestador');

async function runTests() {
  console.log('==================================================================');
  console.log(' [*] GastronomIA - Suite de Pruebas Automatizadas (Node.js)');
  console.log('==================================================================\n');

  // Test 1: Data Access & Seed Consistency (12 Entities)
  console.log('[1/8] Verificando modelo de datos y semilla (12 Entidades)...');
  const ests = DataAccess.getEstablecimientos();
  assert(ests.length >= 15, `Se esperaban al menos 15 establecimientos, obtenidos: ${ests.length}`);
  
  const zonas = new Set(ests.map(e => e.zona));
  assert(zonas.has('CABA'), 'Falta cobertura en CABA');
  assert(zonas.has('Zona Norte (GBA)'), 'Falta cobertura en Zona Norte');
  assert(zonas.has('Zona Sur (GBA)'), 'Falta cobertura en Zona Sur');
  assert(zonas.has('Zona Oeste (GBA)'), 'Falta cobertura en Zona Oeste');

  const restricciones = DataAccess.getRestricciones();
  assert(restricciones.length >= 4, 'Faltan restricciones alimentarias');

  const sintaxis = DataAccess.getEstablecimientoById(4);
  assert(sintaxis && sintaxis.nombre.includes('Sintaxis'), 'Sintaxis no encontrado por ID');
  assert(sintaxis.restricciones.some(r => r.nivel_informacion && r.nivel_informacion.includes('100% libre de gluten')), 'Falta atributo nivel_informacion');
  assert(sintaxis.fuentes.length > 0, 'Falta vinculación de fuentes');
  console.log(`      OK: ${ests.length} establecimientos verificados en CABA, Norte, Sur y Oeste.`);

  // Test 2: User Profile & Preferences Management
  console.log('[2/8] Verificando gestión de Usuario y Preferencias...');
  const user = DataAccess.getUsuario(1);
  assert(user && user.nombre, 'Usuario ID 1 no encontrado');
  
  const updatedUser = DataAccess.updateUsuario(1, {
    presupuesto_preferido: '$$$',
    cocina_favorita: 'Pastas Italianas',
    restricciones: ['sin_tacc', 'vegano']
  });
  assert(updatedUser.presupuesto_preferido === '$$$', 'Fallo actualización de presupuesto');
  assert(updatedUser.restricciones.includes('sin_tacc'), 'Fallo actualización de restricciones');
  console.log('      OK: Perfil de usuario y restricciones alimentarias actualizados y persistidos.');

  // Test 3: AI Service Intent Interpretation & Fallback
  console.log('[3/8] Verificando ServicioIA.interpretarConsulta...');
  const interp1 = await servicioIA.interpretarConsulta('Quiero pizza barata sin tacc en Palermo');
  assert(interp1.restricciones.includes('sin_tacc'), 'No detectó sin_tacc');
  assert(interp1.tipo_cocina === 'Pizzería', `Esperaba Pizzería, obtuvo ${interp1.tipo_cocina}`);
  assert(interp1.rango_precio === '$', `Esperaba $, obtuvo ${interp1.rango_precio}`);
  assert(interp1.zona === 'CABA', `Esperaba CABA, obtuvo ${interp1.zona}`);

  const interpOOB = await servicioIA.interpretarConsulta('Recomendame una parrilla en Córdoba');
  assert(interpOOB.fuera_de_cobertura === true, 'No detectó fuera de cobertura para Córdoba');
  console.log('      OK: Extracción semántica y guardrails de cobertura funcionando.');

  // Test 4: Parameter Validation in Orchestrator
  console.log('[4/8] Verificando BackendOrquestador.validarParametros...');
  const valOOB = backendOrquestador.validarParametros({ fuera_de_cobertura: true, zona: 'Córdoba' });
  assert(!valOOB.valido, 'Debe invalidar parámetros fuera de cobertura');
  assert(valOOB.mensaje.includes('cobertura'), 'Mensaje debe indicar límite de cobertura');

  const valOK = backendOrquestador.validarParametros({ fuera_de_cobertura: false, zona: 'Zona Norte (GBA)' });
  assert(valOK.valido, 'Debe validar parámetros dentro de GBA');
  console.log('      OK: Validación de cobertura y parámetros aprobada.');

  // Test 5: Database Querying in Orchestrator
  console.log('[5/8] Verificando BackendOrquestador.consultarBaseDeDatos...');
  const resParrilla = backendOrquestador.consultarBaseDeDatos({ zona: 'CABA', tipo_cocina: 'Parrilla' });
  assert(resParrilla.length > 0, 'No encontró parrillas en CABA');
  assert(resParrilla.some(r => r.nombre.includes('Don Julio')), 'Don Julio debe estar en resultados');

  const resSinTacc = backendOrquestador.consultarBaseDeDatos({ restricciones: ['sin_tacc'] });
  assert(resSinTacc.length > 0, 'No encontró locales sin tacc');
  assert(resSinTacc.some(r => r.nombre.includes('Sintaxis')), 'Sintaxis debe estar en resultados sin TACC');
  console.log(`      OK: Filtrado de base de datos exacto (${resParrilla.length} parrillas, ${resSinTacc.length} sin TACC).`);

  // Test 6: Response Generation & Anti-Hallucination Guard
  console.log('[6/8] Verificando BackendOrquestador.validarRespuestaIA...');
  const draftDangerous = 'Este lugar es 100% seguro y libre de contaminación garantizado.';
  const safeText = backendOrquestador.validarRespuestaIA(draftDangerous, resSinTacc);
  assert(!safeText.includes('100% seguro'), 'Guardia no eliminó la afirmación de seguridad absoluta');
  assert(safeText.includes('Aviso de Seguridad Alimentaria') || safeText.includes('Aclaración'), 'Falta advertencia alimentaria obligatoria');
  console.log('      OK: Guardia anti-alucinaciones y advertencia de contaminación cruzada activadas.');

  // Test 7: Full 8-Stage Flow Orchestration (procesarConsulta)
  console.log('[7/8] Verificando BackendOrquestador.procesarConsulta (Flujo Completo)...');
  const chatRes = await backendOrquestador.procesarConsulta('Busco un café con opciones sin tacc en Colegiales o Palermo', 1);
  assert(chatRes.respuesta, 'Falta texto de respuesta');
  assert(chatRes.resultados.length > 0, 'No devolvió recomendaciones estructuradas');
  assert(chatRes.mensaje_id, 'No persistió el mensaje en base de datos');
  assert(chatRes.parametros_interpretados, 'Faltan parámetros interpretados');
  assert(chatRes.advertencia_alimentaria === true, 'No marcó advertencia alimentaria');

  // Verificar que la conversación guardó el mensaje
  const mensajes = DataAccess.getMensajesConversacion(chatRes.conversacion_id);
  assert(mensajes.length >= 2, 'Debe haber al menos 2 mensajes (usuario y foody)');
  console.log(`      OK: Flujo de 8 etapas completado exitosamente (Conversación #${chatRes.conversacion_id}).`);

  // Test 8: Review Submission and AI Aspect Extraction
  console.log('[8/8] Verificando creación de Reseña y Extracción de Valoraciones...');
  const aspectos = await servicioIA.extraerValoraciones('Excelente comida sin TACC, las pastas súper ricas y la atención de los mozos fue genial aunque un poco caro.');
  assert(aspectos.length > 0, 'No extrajo valoraciones');
  assert(aspectos.some(a => a.aspecto.includes('sin TACC') || a.aspecto.includes('Atención')), 'No extrajo aspecto específico');

  const resenaId = DataAccess.crearResena(4, 1, 5, 'Comentario de prueba', aspectos);
  assert(resenaId, 'Fallo creación de reseña');

  const venueConResena = DataAccess.getEstablecimientoById(4);
  assert(venueConResena.resenas.some(r => r.id === resenaId), 'La reseña no se vinculó al establecimiento');
  console.log('      OK: Reseña guardada con valoraciones por aspecto extraídas.');

  console.log('\n==================================================================');
  console.log(' [OK] TODAS LAS 8 PRUEBAS PASARON EXITOSAMENTE!');
  console.log('      Arquitectura modular, 12 entidades y flujos IA validados.');
  console.log('==================================================================');
}

runTests().catch(err => {
  console.error('\n[ERROR EN PRUEBAS]:', err);
  process.exit(1);
});
