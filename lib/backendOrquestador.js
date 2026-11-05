/**
 * GastronomIA - Backend Orquestador
 * Implementa el flujo modular en 8 etapas:
 * 1. procesarConsulta(consulta, idUsuario, idConversacion)
 * 2. prepararSolicitudIA(consulta, idUsuario, idConversacion)
 * 3. validarParametros(parametros)
 * 4. consultarBaseDeDatos(parametros)
 * 5. validarRespuestaIA(respuesta, resultados)
 */

const DataAccess = require('./db');
const servicioIA = require('./servicioIA');

class BackendOrquestador {
  /**
   * 1. procesarConsulta: Punto de entrada del chat orquestado
   */
  async procesarConsulta(consulta, idUsuario = 1, idConversacion = null, apiKeyOverride = '', perfilOverride = null, historialOverride = null) {
    if (!consulta || typeof consulta !== 'string' || !consulta.trim()) {
      throw new Error('La consulta no puede estar vacía.');
    }

    // Etapa 1 & 2: Preparar contexto, perfil e historial de conversación
    const contexto = await this.prepararSolicitudIA(consulta, idUsuario, idConversacion, perfilOverride, historialOverride);
    const convId = contexto.conversacion.id;
    if (apiKeyOverride) contexto.apiKey = apiKeyOverride;

    // Guardar mensaje del usuario en persistencia
    DataAccess.guardarMensaje(convId, 'usuario', consulta);

    // Etapa 3: Interpretar consulta con componente de IA
    const parametros = await servicioIA.interpretarConsulta(consulta, contexto);

    // Etapa 4: Validar parámetros (Guardrails de cobertura territorial y viabilidad)
    const validacion = this.validarParametros(parametros);
    if (!validacion.valido) {
      // Corte temprano: Mensaje de límite de cobertura o aclaración
      const respuestaCorte = validacion.mensaje;
      const mensajeId = DataAccess.guardarMensaje(convId, 'foody', respuestaCorte, parametros);

      return {
        conversacion_id: convId,
        mensaje_id: mensajeId,
        respuesta: respuestaCorte,
        parametros_interpretados: parametros,
        resultados: [],
        total: 0,
        fuera_de_cobertura: true,
        aviso: validacion.mensaje
      };
    }

    // Si es una interacción conversacional pura (saludo, agradecimiento, pregunta sobre Foody)
    if (parametros.es_conversacional_puro) {
      const respuestaSaludo = await servicioIA.generarRespuesta(
        consulta,
        [],
        contexto.perfilUsuario,
        contexto,
        parametros
      );
      const mensajeId = DataAccess.guardarMensaje(convId, 'foody', respuestaSaludo, parametros);
      return {
        conversacion_id: convId,
        mensaje_id: mensajeId,
        respuesta: respuestaSaludo,
        parametros_interpretados: parametros,
        resultados: [],
        total: 0,
        fuera_de_cobertura: false,
        es_saludo: true
      };
    }

    // Etapa 5: Consultar base de datos exclusivamente con los criterios validados
    const resultados = this.consultarBaseDeDatos(parametros);

    // Etapa 6: Generar respuesta conversacional con la voz de Foody
    const respuestaBorrador = await servicioIA.generarRespuesta(
      consulta,
      resultados,
      contexto.perfilUsuario,
      contexto,
      parametros
    );

    // Etapa 7: Guardia anti-alucinaciones y seguridad alimentaria
    const respuestaValidada = this.validarRespuestaIA(respuestaBorrador, resultados);

    // Sincronizar y priorizar en las tarjetas los locales que Foody recomendó en su texto
    const textoLower = respuestaValidada.toLowerCase();
    const recomendadosMencionados = [];
    const otrosResultados = [];

    for (const est of resultados) {
      const nombreNorm = est.nombre.toLowerCase().trim();
      if (textoLower.includes(nombreNorm)) {
        recomendadosMencionados.push(est);
      } else {
        otrosResultados.push(est);
      }
    }

    const resultadosFinales = [...recomendadosMencionados, ...otrosResultados];

    // Etapa 8: Persistencia de recomendaciones y entrega al cliente
    const mensajeId = DataAccess.guardarMensaje(convId, 'foody', respuestaValidada, parametros);

    resultadosFinales.slice(0, 5).forEach((est, idx) => {
      DataAccess.guardarRecomendacion(mensajeId, est.id, idx + 1, est.por_que_recomendamos || 'Recomendado por Foody');
    });

    return {
      conversacion_id: convId,
      mensaje_id: mensajeId,
      respuesta: respuestaValidada,
      parametros_interpretados: parametros,
      resultados: resultadosFinales.slice(0, 5),
      total: resultadosFinales.length,
      fuera_de_cobertura: false,
      advertencia_alimentaria: (parametros.restricciones && parametros.restricciones.length > 0)
    };
  }

  /**
   * 2. prepararSolicitudIA:
   * Recupera perfil del usuario, restricciones activas, preferencias e historial conversacional.
   */
  async prepararSolicitudIA(consulta, idUsuario = 1, idConversacion = null, perfilOverride = null, historialOverride = null) {
    const dbPerfil = DataAccess.getUsuario(idUsuario) || {
      id: 1,
      nombre: 'Usuario',
      presupuesto_preferido: '$$',
      ambiente_preferido: 'Tranquilo',
      cocina_favorita: 'Variada',
      restricciones: []
    };

    // Si el cliente envía su perfil personalizado de localStorage, damos prioridad al cliente
    const perfil = perfilOverride && perfilOverride.nombre
      ? {
          ...dbPerfil,
          ...perfilOverride,
          id: dbPerfil.id || 1,
          restricciones: Array.isArray(perfilOverride.restricciones)
            ? perfilOverride.restricciones
            : dbPerfil.restricciones || []
        }
      : dbPerfil;

    let conv = null;
    if (idConversacion) {
      conv = { id: parseInt(idConversacion, 10), usuario_id: perfil.id, estado: 'activa' };
    } else {
      conv = DataAccess.getOrCreateConversacion(perfil.id);
    }

    // Historial: si el cliente envía los turnos recientes del chat activo, los usamos
    let historial = [];
    if (Array.isArray(historialOverride) && historialOverride.length > 0) {
      historial = historialOverride.slice(-6).map(m => ({
        remitente: m.remitente,
        contenido: m.contenido || m.respuesta || '',
        parametros: m.parametros_interpretados
      }));
    } else {
      const dbMsgs = DataAccess.getMensajesConversacion(conv.id);
      historial = dbMsgs.slice(-6).map(m => ({
        remitente: m.remitente,
        contenido: m.contenido,
        parametros: m.parametros_interpretados
      }));
    }

    return {
      perfilUsuario: perfil,
      conversacion: conv,
      historial
    };
  }

  /**
   * 3. validarParametros:
   * Verifica que la zona solicitada esté dentro de CABA o GBA.
   * Si el usuario pide otra región (Córdoba, Madrid, etc.), corta el flujo sin llamar a la base.
   */
  validarParametros(parametros) {
    if (parametros.fuera_de_cobertura) {
      return {
        valido: false,
        mensaje: parametros.mensaje_aclaratorio || 
          `¡Hola! Por el momento, Foody y GastronomIA brindan cobertura exclusiva para la **Ciudad Autónoma de Buenos Aires (CABA)** y el **Gran Buenos Aires (GBA)**. No disponemos de datos para la zona consultada. ¡Probá con lugares en CABA, Zona Norte, Zona Sur o Zona Oeste!`
      };
    }

    // Verificar si la zona interpretada está en la cobertura oficial
    if (parametros.zona) {
      const zLow = parametros.zona.toLowerCase();
      const permitidas = ['caba', 'capital', 'norte', 'sur', 'oeste', 'gba', 'buenos aires', 'palermo', 'recoleta', 'belgrano', 'san telmo', 'villa crespo', 'colegiales', 'la boca', 'san isidro', 'vicente lópez', 'vicente lopez', 'avellaneda', 'lanús', 'lanus', 'banfield', 'ramos mejía', 'morón', 'moron', 'san martín'];
      const esPermitida = permitidas.some(p => zLow.includes(p));

      if (!esPermitida) {
        return {
          valido: false,
          mensaje: `Detecté que estás buscando en **"${parametros.zona}"**, pero recordá que Foody solo cubre **CABA y Gran Buenos Aires (Norte, Sur, Oeste)**. Te invito a explorar opciones en nuestra área de cobertura.`
        };
      }
    }

    return { valido: true };
  }

  /**
   * 4. consultarBaseDeDatos:
   * Filtra establecimientos activos que coincidan con los criterios.
   * Preserva estrictamente el tipo de cocina solicitado, relajando geográficamente
   * a barrios vecinos o a la zona antes de modificar la categoría gastronómica.
   */
  consultarBaseDeDatos(parametros) {
    const zona = parametros.zona || 'CABA';
    const barrio = parametros.barrio;
    const cocina = parametros.tipo_cocina;
    const presupuesto = parametros.rango_precio;
    const ambiente = parametros.ambiente;

    const dietaExplicita = (parametros.restricciones_explicitadas && parametros.restricciones_explicitadas.length > 0)
      ? parametros.restricciones_explicitadas[0]
      : null;
    const dietaPerfil = (parametros.restricciones && parametros.restricciones.length > 0)
      ? parametros.restricciones[0]
      : null;
    const dietaInicial = dietaExplicita || dietaPerfil;

    const filtrosCompletos = {
      zona,
      barrio,
      cocina,
      presupuesto,
      ambiente,
      dieta: dietaInicial
    };

    // 1. Búsqueda con todos los criterios
    let resultados = DataAccess.getEstablecimientos(filtrosCompletos);
    if (resultados.length >= 3) return this.ordenarPorRelevancia(resultados, parametros);

    // 2. Relajar presupuesto y ambiente (manteniendo barrio, cocina y dieta)
    if (presupuesto || ambiente) {
      const rRelajados = DataAccess.getEstablecimientos({
        zona,
        barrio,
        cocina,
        dieta: dietaInicial
      });
      if (rRelajados.length > resultados.length) {
        resultados = rRelajados;
      }
      if (resultados.length >= 3) return this.ordenarPorRelevancia(resultados, parametros);
    }

    // 3. Si hay barrio específico y cocina, buscar en barrios relacionados manteniendo la cocina
    if (barrio && cocina && parametros.barrioInfo?.relacionados) {
      for (const relBarrio of parametros.barrioInfo.relacionados) {
        const rVecinos = DataAccess.getEstablecimientos({
          zona,
          barrio: relBarrio,
          cocina,
          dieta: dietaInicial
        });
        for (const item of rVecinos) {
          if (!resultados.some(x => x.id === item.id)) {
            resultados.push(item);
          }
          if (resultados.length >= 6) break;
        }
        if (resultados.length >= 6) break;
      }
      if (resultados.length >= 3) return this.ordenarPorRelevancia(resultados, parametros);
    }

    // 4. Si aún son insuficientes y se pidió un tipo de cocina específico:
    // Buscar en toda la zona (ej. CABA) manteniendo estrictamente el tipo de cocina
    if (cocina) {
      const rZonaCocina = DataAccess.getEstablecimientos({
        zona,
        cocina,
        dieta: dietaInicial
      });
      for (const item of rZonaCocina) {
        if (!resultados.some(x => x.id === item.id)) {
          resultados.push(item);
        }
        if (resultados.length >= 6) break;
      }
      if (resultados.length >= 3) return this.ordenarPorRelevancia(resultados, parametros);

      // Si la dieta del perfil (no explicitada) impidió encontrar opciones de esa cocina,
      // buscar esa cocina en el barrio o zona sin la restricción dietética
      if (!dietaExplicita && dietaPerfil && resultados.length === 0) {
        const rCocinaSinDieta = DataAccess.getEstablecimientos({
          zona,
          barrio,
          cocina
        });
        if (rCocinaSinDieta.length > 0) return this.ordenarPorRelevancia(rCocinaSinDieta, parametros);

        const rZonaCocinaSinDieta = DataAccess.getEstablecimientos({
          zona,
          cocina
        });
        if (rZonaCocinaSinDieta.length > 0) return this.ordenarPorRelevancia(rZonaCocinaSinDieta, parametros);
      }

      // Si se pidió cocina pero no hay nada, retornar lo encontrado (nunca cambiar de cocina a parrilla/pizzería)
      return this.ordenarPorRelevancia(resultados, parametros);
    }

    // 5. Si no se pidió cocina, buscar por barrio
    if (barrio && resultados.length === 0) {
      resultados = DataAccess.getEstablecimientos({
        zona,
        barrio,
        dieta: dietaInicial
      });
      if (resultados.length >= 3) return this.ordenarPorRelevancia(resultados, parametros);
    }

    // 6. Fallback final solo si NO se especificó tipo de cocina
    if (resultados.length === 0 && !cocina && zona) {
      resultados = DataAccess.getEstablecimientos({ zona });
    }

    return this.ordenarPorRelevancia(resultados, parametros);
  }

  /**
   * Ordena resultados por relevancia gastronómica y geográfica para la consulta.
   */
  ordenarPorRelevancia(resultados, parametros = {}) {
    if (!resultados || resultados.length <= 1) return resultados || [];

    const cocina = (parametros.tipo_cocina || '').toLowerCase();
    const barrio = (parametros.barrio || '').toLowerCase();

    return [...resultados].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const nomA = (a.nombre || '').toLowerCase();
      const nomB = (b.nombre || '').toLowerCase();
      const cocA = (a.cocina || '').toLowerCase();
      const cocB = (b.cocina || '').toLowerCase();
      const catA = (a.categoria || '').toLowerCase();
      const catB = (b.categoria || '').toLowerCase();
      const dirA = (a.direccion || '').toLowerCase();
      const dirB = (b.direccion || '').toLowerCase();
      const barA = (a.barrio || '').toLowerCase();
      const barB = (b.barrio || '').toLowerCase();

      // Criterio de cocina / cervecería
      if (/cervec|birr|bar|pub/i.test(cocina)) {
        if (/birr|cervec|cervez/i.test(nomA)) scoreA += 60;
        if (/birr|cervec|cervez/i.test(nomB)) scoreB += 60;
        if (/bar|pub/i.test(nomA)) scoreA += 30;
        if (/bar|pub/i.test(nomB)) scoreB += 30;
        if (/bar \/ pub/i.test(catA)) scoreA += 20;
        if (/bar \/ pub/i.test(catB)) scoreB += 20;
        if (/bar|cervec|minuta/i.test(cocA)) scoreA += 15;
        if (/bar|cervec|minuta/i.test(cocB)) scoreB += 15;
      } else if (cocina) {
        if (nomA.includes(cocina)) scoreA += 40;
        if (nomB.includes(cocina)) scoreB += 40;
        if (cocA.includes(cocina)) scoreA += 30;
        if (cocB.includes(cocina)) scoreB += 30;
      }

      // Criterio de barrio / zona
      if (barrio) {
        if (barA.includes(barrio) || dirA.includes(barrio)) scoreA += 35;
        if (barB.includes(barrio) || dirB.includes(barrio)) scoreB += 35;
        if (barrio.includes('congreso')) {
          if (/callao|mitre|yrigoyen|alsina|montevideo|corrientes/i.test(dirA)) scoreA += 25;
          if (/callao|mitre|yrigoyen|alsina|montevideo|corrientes/i.test(dirB)) scoreB += 25;
          if (/balvanera|san nicol|monserrat/i.test(barA)) scoreA += 15;
          if (/balvanera|san nicol|monserrat/i.test(barB)) scoreB += 15;
        }
      }

      return scoreB - scoreA;
    });
  }

  /**
   * 5. validarRespuestaIA:
   * Guardia anti-alucinaciones:
   * - Verifica que la respuesta no mencione locales inventados que no estén en resultados.
   * - Verifica que no prometa "seguridad absoluta / 100% libre de contaminación".
   */
  validarRespuestaIA(respuesta, resultados = []) {
    let texto = respuesta || '';

    // Regla 1: Anti-alucinación de locales
    // Si la respuesta menciona un nombre en negritas que parece un local pero no está en resultados
    const nombresReales = resultados.map(r => r.nombre.toLowerCase());
    
    // Regla 2: Seguridad alimentaria estricta
    // Verificar si el texto afirma falsamente "100% seguro" o "cero riesgo de contaminación"
    const afirmacionPeligrosaRegex = /(100%\s*seguro|cero\s*riesgo|garantizamos\s*ausencia|totalmente\s*libre\s*de\s*contaminaci[oó]n\s*cruzada)/i;
    if (afirmacionPeligrosaRegex.test(texto)) {
      texto = texto.replace(afirmacionPeligrosaRegex, 'con opciones identificadas');
      texto += '\n\n⚠️ **Aclaración Importante:** Ningún establecimiento puede garantizar ausencia absoluta de trazas sin verificación directa. Llamá siempre al local antes de asistir.';
    }

    // Regla 3: Si hay resultados con restricción pero no hay advertencia, agregarla
    const tieneRestricciones = resultados.some(r => r.restricciones && r.restricciones.length > 0);
    if (tieneRestricciones && !texto.includes('Seguridad Alimentaria') && !texto.includes('contaminación cruzada')) {
      texto += '\n\n⚠️ **Aviso de Seguridad Alimentaria:** La información proviene de registros públicos y declaraciones del establecimiento. No garantiza ausencia de contaminación cruzada. Confirmá siempre con el local.';
    }

    return texto;
  }
}

module.exports = new BackendOrquestador();
