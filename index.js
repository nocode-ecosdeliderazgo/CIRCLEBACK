// index.js
require('dotenv').config();
const express = require('express');
const axios   = require('axios');
const crypto  = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
console.log('🔧  index.js arrancó');

//--- Variables de entorno
const {
  CODA_API_TOKEN,
  CODA_DOC_ID,
  DB_reuniones,
  DB_insights,
  DB_miembros,
  DB_equipos,
  DB_project,
  CIRCLEBACK_SECRET
} = process.env;

const TABLES = {
  reuniones:       DB_reuniones,
  inisights:    DB_insights,
  miembros:     DB_miembros,
  proyect:      DB_equipos,
  DecisionesEstratégicas:   DB_project,
};

// Verifica firma (opcional)
function verifySignature(signature, rawBody) {
  if (!CIRCLEBACK_SECRET) return true;
  const received = signature.replace(/^sha256=/, '');
  const expected = crypto
    .createHmac('sha256', CIRCLEBACK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected,  'hex'),
    Buffer.from(received, 'hex')
  );
}

// Inserta filas en bloques con delays y logging de respuesta
async function insertarEnBloques(tableKey, filas) {
  if (!filas || filas.length === 0) {
    console.log(`✅  [${tableKey}] No hay filas para insertar. Saltando.`);
    return;
  }

  const tableId = TABLES[tableKey];
  const url = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${tableId}/rows`;
  const batchSize = 25;   // Ajusta si tu tabla admite menos filas por request
  const minDelay = 700;   // 700 ms entre cada POST para respetar 10/6 s

  console.log(`🆕  [${tableKey}] Empezando inserción de ${filas.length} filas en lotes de ${batchSize}...`);

  for (let i = 0; i < filas.length; i += batchSize) {
    const lote = filas.slice(i, i + batchSize);
    console.log(`   ➡️  [${tableKey}] Enviando lote ${Math.floor(i/batchSize) + 1} (filas ${i}–${Math.min(i + batchSize - 1, filas.length - 1)})`);

    let success = false, intentos = 0;
    while (!success && intentos < 8) {
      try {
        const response = await axios.post(
          url,
          { rows: lote },
          { headers: { Authorization: `Bearer ${CODA_API_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        console.log(`   ✅  [${tableKey}] Lote ${Math.floor(i/batchSize) + 1} insertado correctamente.`);
        const res = JSON.stringify(response.data, null, 2);
        console.log(`       [${tableKey}] Respuesta completa:`, JSON.stringify(response.data, null, 2));
        // Imprimimos la respuesta bruta para ver qué reconoce Coda
        console.log(`       [${tableKey}] Response rows:`, JSON.stringify(response.data.insertedRowIds || response.data, null, 2));
        success = true;
      } catch (err) {
        if (err.response?.status === 429) {
          const delay = minDelay * (intentos + 2);
          console.warn(`   ⚠️  [${tableKey}] 429 recibido. Esperando ${delay}ms antes de reintentar (intento ${intentos + 1})`);
          await new Promise(res => setTimeout(res, delay));
          intentos++;
        } else {
          console.error(`   ❌  [${tableKey}] Error insertando lote ${Math.floor(i/batchSize) + 1}:`,
            err.response ? err.response.data : err.message);
          break;
        }
      }
    }

    if (i + batchSize < filas.length) {
      console.log(`   ⏳  [${tableKey}] Esperando ${minDelay}ms antes del siguiente lote.`);
      await new Promise(res => setTimeout(res, minDelay));
    }
  }

  console.log(`📦  [${tableKey}] Inserción completada.`);
}

// Procesa e inserta todas las tablas en serie
async function procesarTodoYMandarACoda(data) {
const filasInsights = [];
const filasProyectos = [];
const filasReuniones = [];
const filasRoadmap = [];
const filasEquipos = [];
const filasMiembros = [];

 
  
(data.insights || []).forEach((item) => {
  const insight = item.insight || item;
  if (!insight) return;
  filasInsights.push({
    cells: [
      { column: 'Insight', value: insight.Insight || '' },
      { column: 'Proyecto', value: insight.Proyecto || '' },
      { column: 'Tipo de insight', value: insight['Tipo de insight'] || '' },
      { column: 'Responsable', value: insight.Responsable || '' },
      { column: 'Participantes relacionados', value: insight['Participantes relacionados'].join(", ") || '' },
      { column: 'Reunión', value: insight['Reunión'] || '' },
      { column: 'Semana del proyecto', value: insight['Semana del proyecto'] || '' },
      { column: 'Fecha y hora de asignación', value: insight['Fecha y hora de asignación'] || '' },
      { column: 'Notas adicionales', value: insight['Notas adicionales'] || '' },
      { column: 'Estado', value: insight.Estado || '' },
      { column: 'Prioridad', value: insight.Prioridad || '' },
      { column: 'Sentimiento detectado', value: insight['Sentimiento detectado'] || '' },
      { column: '¿Seguimiento?', value: insight['¿Seguimiento?'] || false },
      { column: 'Fecha de entrega', value: insight['Fecha de entrega'] || '' }
    ]
  });
});


(data.proyectos || []).forEach((item) => {
  const proyecto = item.insight || item;
  if (!proyecto) return;
  filasProyectos.push({
    cells: [
      { column: 'Nombre del proyecto', value: proyecto['Nombre del proyecto'] || '' },
      { column: 'Descripción breve', value: proyecto['Descripción breve'] || '' },
      { column: 'Lider del proyecto', value: proyecto['Lider del proyecto'] || '' },
      { column: 'Fecha de inicio', value: proyecto['Fecha de inicio'] || '' },
      { column: 'Fecha estimada de cierre', value: proyecto['Fecha estimada de cierre'] || '' },
      { column: 'Estado del proyecto', value: proyecto['Estado del proyecto'] || '' },
      { column: 'Prioridad', value: proyecto['Prioridad'] || '' },
      { column: 'Insights', value: proyecto['Insights'].join(", ") || '' }
    ]
  });
});

(data.reuniones || []).forEach((item) => {
  const reunion = item.insight || item;
  if (!reunion) return;
  filasReuniones.push({
    cells: [
      { column: 'Fecha y hora', value: reunion['Fecha y hora'] || '' },
      { column: 'Asistentes', value: reunion['Asistentes'].join(", ") || '' },
      { column: 'Temática', value: reunion['Temática'] || '' },
      { column: 'Documento de referencia', value: reunion['Documento de referencia'] || '' },
      { column: 'Resumen breve', value: reunion['Resumen breve'] || '' },
      { column: 'Status de revisión', value: reunion['Status de revisión'] || '' },
      { column: 'Insights extraídos', value: reunion['Insights extraídos'].join(", ") || '' },
      { column: '¿De qué proyecto?', value: reunion['¿De qué proyecto?'] || '' }
    ]
  });
});


(data.roadmap || []).forEach((item) => {
  const roadItem = item.insight || item;
  if (!roadItem) return;
  filasRoadmap.push({
    cells: [
      { column: 'Proyecto', value: roadItem.Proyecto || '' },
      { column: 'Semar', value: roadItem.Semana || '' },
      { column: 'Fecha de inicio', value: roadItem['Fecha de inicio'] || '' },
      { column: 'Fecha de entrega', value: roadItem['Fecha de entrega'] || '' },
      { column: 'Hito', value: roadItem.Hito || '' },
      { column: 'Insights por semana', value: roadItem['Insights por semana'].join(", ") || '' },
      { column: '¿Entregado?', value: roadItem['¿Entregado?'] || '' },
      { column: 'Evidencia', value: roadItem.Evidencia || '' }
    ]
  });
});

(data.equipos || []).forEach((item) => {
  const equipo = item.insight || item;
  if (!equipo) return;
  filasEquipos.push({
    cells: [
      { column: 'Equipo', value: equipo.Equipo || '' },
      { column: 'Descripción', value: equipo.Descripción || '' },
      { column: 'Integrantes', value: equipo.Integrantes.join(", ") || '' }
    ]
  });
});




  // // 1. reunionesS
  // (data.reuniones || []).forEach((item) => {
  //   // Usa "insight" si existe o vuelve a la propiedad original
  //   const reuniones = item.insight || item.reuniones || item;
  //   if (!reuniones) return;
  //   filasreunioness.push({
  //     cells: [
  //       { column: 'reuniones_id',                    value: reuniones.reuniones_id || '' },
  //       { column: 'tema_principal',              value: reuniones.tema_principal || '' },
  //       { column: 'descripcion_completa',        value: reuniones.descripcion_completa || '' },
  //       { column: 'responsable_directo',         value: reuniones.responsable_directo || '' },
  //       { column: 'otros_participantes',         value: reuniones.otros_participantes || '' },
  //       { column: 'fecha_limite',                value: reuniones.fecha_limite || '' },
  //       { column: 'proyecto_o_area_relacionada', value: reuniones.proyecto_o_area_relacionada || '' },
  //       { column: 'impacto_importancia',         value: reuniones.impacto_importancia || '' },
  //       { column: 'requiere_seguimiento',        value: reuniones.requiere_seguimiento !== undefined ? reuniones.requiere_seguimiento : false },
  //       { column: 'notas_adicionales',           value: reuniones.notas_adicionales || '' }
  //     ]
  //   });
  // });
  // // 2. PREGUNTAS PENDIENTES
  // (data.inisights || []).forEach((item) => {
  //   const pregunta = item.insight || item.pregunta || item;
  //   if (!pregunta) return;
  //   filasEquipos.push({
  //     cells: [
  //       { column: 'pregunta_id',    value: pregunta.pregunta_id || '' },
  //       { column: 'texto_pregunta', value: pregunta.texto_pregunta || '' },
  //       { column: 'autor_pregunta', value: pregunta.autor_pregunta || '' },
  //       { column: 'contexto',       value: pregunta.contexto || '' },
  //       { column: 'estado_actual',  value: pregunta.estado_actual || '' },
  //       { column: 'fecha_registro', value: pregunta.fecha_registro || '' }
  //     ]
  //   });
  // });

  // // 3. miembros
  // (data.miembros || []).forEach((item) => {
  //   const fb = item.insight || item.fb || item;
  //   if (!fb) return;
  //   filasmiembros.push({
  //     cells: [
  //       { column: 'miembros_id',    value: fb.miembros_id || '' },
  //       { column: 'autor_miembros', value: fb.autor_miembros || '' },
  //       { column: 'texto_miembros', value: fb.texto_miembros || '' },
  //       { column: 'categoria',      value: fb.categoria || '' },
  //       { column: 'urgencia',       value: fb.urgencia || '' },
  //       { column: 'fecha_miembros', value: fb.fecha_miembros || '' }
  //     ]
  //   });
  // });

  // // 4. RIESGOS/BLOQUEOS
  // (data.proyect || []).forEach((item) => {
  //   const riesgo = item.insight || item.riesgo || item;
  //   if (!riesgo) return;
  //   filasProject.push({
  //     cells: [
  //       { column: 'riesgo_id',            value: riesgo.riesgo_id || '' },
  //       { column: 'bloqueo_id',           value: riesgo.bloqueo_id || '' },
  //       { column: 'tipo',                 value: riesgo.tipo || '' },
  //       { column: 'descripcion',          value: riesgo.descripcion || '' },
  //       { column: 'origen',               value: riesgo.origen || '' },
  //       { column: 'impacto_posible',      value: riesgo.impacto_posible || '' },
  //       { column: 'accion_recomendada',   value: riesgo.accion_recomendada || '' },
  //       { column: 'responsable',          value: riesgo.responsable || '' },
  //       { column: 'fecha_identificacion', value: riesgo.fecha_identificacion || '' }
  //     ]
  //   });
  // });

  // // 5. DECISIONES ESTRATÉGICAS
  // (data.DecisionesEstratégicas || []).forEach((item) => {
  //   const d = item.insight || item.d || item;
  //   if (!d) return;
  //   filasDecisiones.push({
  //     cells: [
  //       { column: 'decision_id',            value: d.decision_id || '' },
  //       { column: 'tipo_de_insight',        value: d.tipo_de_insight || 'decision' },
  //       { column: 'descripcion_decision',   value: d.descripcion_decision || '' },
  //       { column: 'justificacion',          value: d.justificacion || '' },
  //       { column: 'participantes_clave',    value: d.participantes_clave || '' },
  //       { column: 'fecha_decision',         value: d.fecha_decision || '' },
  //       { column: 'impacto_en',             value: d.impacto_en || '' },
  //       { column: 'seguimiento_requerido',  value: d.seguimiento_requerido !== undefined ? d.seguimiento_requerido : false },
  //       { column: 'proxima_fecha_revision', value: d.proxima_fecha_revision || '' }
  //     ]
  //   });
  // });

  // // 6. IDEAS / SEGUIMIENTO / INFO
  // (data.IdeasSeguimientoInfo || []).forEach((item) => {
  //   const idea = item.insight || item.idea || item;
  //   if (!idea) return;
  //   filasIdeas.push({
  //     cells: [
  //       { column: 'idea_id',             value: idea.idea_id || idea.seguimiento_id || idea.info_id || '' },
  //       { column: 'tipo_de_insight',     value: idea.tipo_de_insight || 'idea' },
  //       { column: 'tema_principal',      value: idea.tema_principal || '' },
  //       { column: 'descripcion',         value: idea.descripcion || '' },
  //       { column: 'responsable_directo', value: idea.responsable_directo || '' },
  //       { column: 'otros_participantes', value: idea.otros_participantes || '' },
  //       { column: 'fecha_reunion',       value: idea.fecha_reunion || '' },
  //       { column: 'notas_adicionales',   value: idea.notas_adicionales || '' }
  //     ]
  //   });
  // });

  // // 7. RESUMEN REUNIÓN
  // (data.equipos || []).forEach((item) => {
  //   const r = item.insight || item.r || item;
  //   if (!r) return;
  //   filasResumen.push({
  //     cells: [
  //       { column: 'reunion_id',                value: r.reunion_id || '' },
  //       { column: 'fecha_reunion',             value: r.fecha_reunion || '' },
  //       { column: 'titulo_reunion',            value: r.titulo_reunion || '' },
  //       { column: 'resumen_general',           value: r.resumen_general || '' },
  //       { column: 'participantes_principales', value: r.participantes_principales || '' },
  //       { column: 'temas_clave',               value: r.temas_clave || '' },
  //       { column: 'decisiones_tomadas',        value: r.decisiones_tomadas || '' },
  //       { column: 'reunioness_identificadas',      value: r.reunioness_identificadas || '' },
  //       { column: 'bloqueos_detectados',       value: r.bloqueos_detectados || '' },
  //       { column: 'seguimiento_requerido',     value: r.seguimiento_requerido || '' },
  //       { column: 'proyectos_relacionados',    value: r.proyectos_relacionados || '' }
  //     ]
  //   });
  // });

  // // 8. NUEVO SCHEMA REUNIÓN
  // (data.NuevoSchemaReunion || []).forEach((item) => {
  //   const schema = item.insight || item.schema || item;
  //   if (!schema) return;
  //   filasnuevostemas.push({
  //     cells: [
  //       { column: 'schema_id',        value: schema.schema_id || '' },
  //       { column: 'motivo_generico',  value: schema.motivo_generico || '' },
  //       { column: 'campos_sugeridos', value: schema.campos_sugeridos || '' },
  //       { column: 'valor_ejemplo',    value: schema.valor_ejemplo || '' }
  //     ]
  //   });
  // });

  // // 9. INSIGHTS DETALLADOS
  // (data.inisght || []).forEach((detalle, index) => {
  //   // Si existe la propiedad "insight", úsala; de lo contrario, usa "detalle" directamente.
  //   const insight = detalle.insight || detalle;
  //   filasInsights.push({
  //     cells: [
  //       // 👉 Column IDs adaptados al nuevo esquema
  //       { column: 'insight_id',                  value: insight.insight_id },
  //       { column: 'tipo_de_insight',             value: insight.tipo_de_insight || 'reuniones' },
  //       { column: 'tema_principal',              value: insight.tema_principal || '' },
  //       { column: 'resumen',                     value: insight.resumen || '' },
  //       { column: 'descripcion_completa',        value: insight.descripcion_completa || '' },
  //       { column: 'responsable_directo',         value: insight.responsable_directo || '' },
  //       { column: 'otros_participantes',         value: insight.otros_participantes || '' },
  //       { column: 'fecha_limite',                value: insight.fecha_limite || '' },
  //       { column: 'proyecto_o_area_relacionada', value: insight.proyecto_o_area_relacionada || '' },
  //       { column: 'impacto_importancia',         value: insight.impacto_importancia || '' },
  //       { column: 'requiere_seguimiento',        value: insight.requiere_seguimiento ?? '' },
  //       { column: 'notas_adicionales',           value: insight.notas_adicionales || '' }
  //     ]
  //   });
  // });

  // Insertar las tablas en serie
  console.log('⏳  Empezando inserción en Coda de todas las tablas en serie...');
 await insertarEnBloques('DB_insights', filasInsights);
await insertarEnBloques('DB_proyectos', filasProyectos);
await insertarEnBloques('DB_reuniones', filasReuniones);
await insertarEnBloques('Roadmap', filasRoadmap);
await insertarEnBloques('DB_equipos', filasEquipos);
await insertarEnBloques('DB_miembros', filasMiembros);

  console.log('✅  Inserción en Coda completada para todas las tablas.');
}

//--- Ruta webhook ---
app.post(
  '/circleback_webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-signature'] || '';

    if (!verifySignature(signature, req.body)) {
      console.warn('⚠️  Firma inválida');
      return res.status(401).send('Bad signature');
    }

    res.status(200).end('OK');
    try {
      const payload = JSON.parse(req.body.toString('utf8'));
      console.log('☑️  Payload verificado:', payload);
      const filename = `payload_${Date.now()}.json`;
      const filepath = path.join(__dirname, filename);
      fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
      console.log(`💾  Payload guardado en ${filename}`);
      if (!payload || !payload.insights) {
        console.warn('⚠️  Payload no contiene insights. Ignorando.');
        return;
      }
      console.log('🔍  Payload contiene insights. Procesando...');
      console.log('📦  Payload recibido:', JSON.stringify(payload, null, 2));

      // Verifica que el payload tenga la estructura esperada
      if (!payload.insights || typeof payload.insights !== 'object') {
        console.warn('⚠️  Payload no tiene la estructura esperada. Ignorando.');
        return;
      }
      console.log('✅  Payload tiene la estructura esperada. Procesando...');
      // Asegúrate de que el payload tenga las claves esperadas
      if (!payload.createdAt || !payload.id) {
        console.warn('⚠️  Payload no contiene createdAt o id. Ignorando.');
        return;
      }
      console.log('✅  Payload contiene createdAt e id. Procesando...');
      console.log('📅  Fecha de creación:', payload.createdAt)
      console.log('🔑  ID del payload:', payload.id)
      console.log('🔍  Insights encontrados:', Object.keys(payload.insights))
      console.log('🔄  Normalizando datos para Coda...')

      // Si no, asigna valores por defecto o maneja el caso
      if (!payload.insights['reuniones']  &&
          !payload.insights['miembros'] && !payload.insights['proyect']   &&
          !payload.insights['equipos'] &&
          !payload.insights['inisght']) {
        console.warn('⚠️  Payload no contiene insights válidos. Ignorando.');
        return;
      }
      console.log('✅  Payload contiene insights válidos. Procesando...');
      console.log('🔄  Normalizando datos para Coda...')
      ;
      // Normaliza los nombres de las claves para que coincidan con los esperados por procesarTodoYMandarACoda
      const insights = payload.insights || {};
      const convertedData = {
        reuniones:                   insights['reuniones'] || [],
        inisights:     insights['inisights'] || [],
        miembros:                 insights['miembros'] || [],
        proyect:         insights['proyect'] || [],
        equipos:          insights['equipos'],
        inisght:        insights['inisght'] || [],
      };

      await procesarTodoYMandarACoda(convertedData);
    } catch (err) {
      console.error('❌  Error parseando JSON del webhook:', err.message);
    }
  }
);

const PORT = process.env.PORT || 3000;
console.log('🟢  A punto de llamar a app.listen');
app.listen(PORT, () =>
  console.log(`🚀  Servidor Express en http://localhost:${PORT}`)
);
