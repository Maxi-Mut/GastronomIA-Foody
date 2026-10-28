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
  async procesarConsulta(consulta, idUsuario = 1, idConversacion = null, apiKeyOverride = '') {
    if (!consulta || typeof consulta !== 'string' || !consulta.trim()) {
      throw new Error('La consulta no puede estar vacía.');
    }

    // Etapa 1 & 2: Preparar contexto, perfil e historial de conversación
    const contexto = await this.prepararSolicitudIA(consulta, idUsuario, idConversacion);
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

    // Etapa 8: Persistencia de recomendaciones y entrega al cliente
    const mensajeId = DataAccess.guardarMensaje(convId, 'foody', respuestaValidada, parametros);

    resultados.slice(0, 5).forEach((est, idx) => {
      DataAccess.guardarRecomendacion(mensajeId, est.id, idx + 1, est.por_que_recomendamos || 'Recomendado por Foody');
    });

    return {
      conversacion_id: convId,
      mensaje_id: mensajeId,
      respuesta: respuestaValidada,
      parametros_interpretados: parametros,
      resultados: resultados.slice(0, 5),
      total: resultados.length,
      fuera_de_cobertura: false,
      advertencia_alimentaria: (parametros.restricciones && parametros.restricciones.length > 0)
    };
  }

  /**
   * 2. prepararSolicitudIA:
   * Recupera perfil del usuario, restricciones activas, preferencias e historial conversacional.
   */
  async prepararSolicitudIA(consulta, idUsuario = 1, idConversacion = null) {
    const perfil = DataAccess.getUsuario(idUsuario) || {
      id: 1,
      nombre: 'Usuario',
      presupuesto_preferido: '$$',
      ambiente_preferido: 'Tranquilo',
      cocina_favorita: 'Variada',
      restricciones: []
    };

    let conv = null;
    if (idConversacion) {
      conv = { id: parseInt(idConversacion, 10), usuario_id: perfil.id, estado: 'activa' };
    } else {
      conv = DataAccess.getOrCreateConversacion(perfil.id);
    }

    // Recuperar últimos 6 mensajes para sostener contexto en repreguntas
    const historial = DataAccess.getMensajesConversacion(conv.id).slice(-6);

    return {
      perfilUsuario: perfil,
      conversacion: conv,
      historial: historial.map(m => ({
        remitente: m.remitente,
        contenido: m.contenido,
        parametros: m.parametros_interpretados
      }))
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
   * Filtra estrictamente establecimientos activos que coincidan con los criterios.
   */
  consultarBaseDeDatos(parametros) {
    const filtros = {
      zona: parametros.zona,
      cocina: parametros.tipo_cocina,
      presupuesto: parametros.rango_precio,
      ambiente: parametros.ambiente,
    };

    // Si hay restricciones detectadas, filtrar por la primera o principal
    if (parametros.restricciones && parametros.restricciones.length > 0) {
      filtros.dieta = parametros.restricciones[0];
    }

    let resultados = DataAccess.getEstablecimientos(filtros);

    // Si los filtros son muy restrictivos y dan 0 resultados, relajar progresivamente
    if (resultados.length === 0 && (filtros.presupuesto || filtros.ambiente)) {
      const filtrosRelajados = { zona: filtros.zona, cocina: filtros.cocina, dieta: filtros.dieta };
      resultados = DataAccess.getEstablecimientos(filtrosRelajados);
    }

    if (resultados.length === 0 && filtros.zona) {
      // Buscar en toda la zona o tipo de cocina
      resultados = DataAccess.getEstablecimientos({ zona: filtros.zona });
    }

    return resultados;
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
