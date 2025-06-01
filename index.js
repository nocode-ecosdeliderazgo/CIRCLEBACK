require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const {
  CODA_API_TOKEN,
  CODA_DOC_ID,
  CODA_TABLE_TAREAS_ID,
  CODA_TABLE_PREGUNTAS_ID,
  CODA_TABLE_FEEDBACK_ID,
  CODA_TABLE_RIESGOS_ID,
  CODA_TABLE_DECISIONES_ID,
  CODA_TABLE_IDEAS_ID,
  CODA_TABLE_RESUMEN_ID,
  CODA_TABLE_NUEVOSCHEMAS_ID,
  CIRCLEBACK_SECRET
} = process.env;

const TABLES = {
  tareas: CODA_TABLE_TAREAS_ID,
  preguntas: CODA_TABLE_PREGUNTAS_ID,
  feedback: CODA_TABLE_FEEDBACK_ID,
  riesgos: CODA_TABLE_RIESGOS_ID,
  decisiones: CODA_TABLE_DECISIONES_ID,
  ideas: CODA_TABLE_IDEAS_ID,
  resumen: CODA_TABLE_RESUMEN_ID,
  nuevoschemas: CODA_TABLE_NUEVOSCHEMAS_ID
};

function verifySignature(signature, body) {
  const hmacDigest = crypto
    .createHmac('sha256', CIRCLEBACK_SECRET)
    .update(body)
    .digest('hex');
  return hmacDigest === signature;
}

async function agregarFilaACoda(tableKey, fila) {
  try {
    const tableId = TABLES[tableKey];
    const url = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${tableId}/rows`;
    const payload = {
      rows: [
        {
          cells: Object.entries(fila).map(([k, v]) => ({
            column: k,
            value: v
          }))
        }
      ]
    };
    await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${CODA_API_TOKEN}` }
    });
  } catch (error) {
    console.error(`Error insertando en Coda (${tableKey}):`, error.response ? error.response.data : error.message);
  }
}

function procesarTodoYMandarACoda(data) {
  // 1. TAREAS
  (data.tareas || []).forEach(tarea => {
    const fila = {
      tarea_id: tarea.tarea_id,
      tema_principal: tarea.tema_principal,
      descripcion_completa: tarea.descripcion_completa,
      responsable_directo: tarea.responsable_directo,
      otros_participantes: tarea.otros_participantes,
      fecha_limite: tarea.fecha_limite,
      proyecto_o_area_relacionada: tarea.proyecto_o_area_relacionada,
      impacto_importancia: tarea.impacto_importancia,
      requiere_seguimiento: tarea.requiere_seguimiento,
      notas_adicionales: tarea.notas_adicionales
    };
    agregarFilaACoda('tareas', fila);
  });

  // 2. PREGUNTAS
  (data.preguntas_pendientes || []).forEach(pregunta => {
    const fila = {
      pregunta_id: pregunta.pregunta_id,
      texto_pregunta: pregunta.texto_pregunta,
      autor_pregunta: pregunta.autor_pregunta,
      contexto: pregunta.contexto,
      estado_actual: pregunta.estado_actual,
      fecha_registro: pregunta.fecha_registro
    };
    agregarFilaACoda('preguntas', fila);
  });

  // 3. FEEDBACK
  (data.feedback || []).forEach(feedback => {
    const fila = {
      feedback_id: feedback.feedback_id,
      autor_feedback: feedback.autor_feedback,
      texto_feedback: feedback.texto_feedback,
      categoría: feedback.categoría,
      urgencia: feedback.urgencia,
      fecha_feedback: feedback.fecha_feedback
    };
    agregarFilaACoda('feedback', fila);
  });

  // 4. RIESGOS/BLOQUEOS
  (data.riesgos_bloqueos || []).forEach(riesgo => {
    const fila = {
      riesgo_id: riesgo.riesgo_id || riesgo.bloqueo_id,
      tipo: riesgo.tipo,
      descripción: riesgo.descripción,
      origen: riesgo.origen,
      impacto_posible: riesgo.impacto_posible,
      acción_recomendada: riesgo.acción_recomendada,
      responsable: riesgo.responsable,
      fecha_identificación: riesgo.fecha_identificación
    };
    agregarFilaACoda('riesgos', fila);
  });

  // 5. DECISIONES
  (data.decisiones_estrategicas || []).forEach(decision => {
    const fila = {
      decision_id: decision.decision_id,
      descripción_decisión: decision.descripción_decisión,
      justificación: decision.justificación,
      participantes_clave: decision.participantes_clave,
      fecha_decisión: decision.fecha_decisión,
      impacto_en: decision.impacto_en,
      seguimiento_requerido: decision.seguimiento_requerido,
      próxima_fecha_revisión: decision.próxima_fecha_revisión
    };
    agregarFilaACoda('decisiones', fila);
  });

  // 6. IDEAS / SEGUIMIENTO / INFO
  (data.ideas_seguimiento_info || []).forEach(idea => {
    const fila = {
      idea_id: idea.idea_id || idea.seguimiento_id || idea.info_id,
      tema_principal: idea.tema_principal,
      descripción: idea.descripción,
      responsable_directo: idea.responsable_directo,
      otros_participantes: idea.otros_participantes,
      fecha_reunión: idea.fecha_reunión,
      notas_adicionales: idea.notas_adicionales
    };
    agregarFilaACoda('ideas', fila);
  });

  // 7. RESUMEN REUNIÓN
  if (data.resumen_reunion) {
    const resumen = data.resumen_reunion;
    const fila = {
      reunion_id: resumen.reunion_id,
      fecha_reunión: resumen.fecha_reunión,
      titulo_reunión: resumen.titulo_reunión,
      resumen_general: resumen.resumen_general,
      participantes_principales: resumen.participantes_principales,
      temas_clave: resumen.temas_clave,
      decisiones_tomadas: resumen.decisiones_tomadas,
      tareas_identificadas: resumen.tareas_identificadas,
      bloqueos_detectados: resumen.bloqueos_detectados,
      seguimiento_requerido: resumen.seguimiento_requerido,
      proyectos_relacionados: resumen.proyectos_relacionados
    };
    agregarFilaACoda('resumen', fila);
  }

  // 8. NUEVO SCHEMA REUNIÓN
  (data.nuevo_schema_reunion || []).forEach(schema => {
    const fila = {
      schema_id: schema.schema_id,
      motivo_genérico: schema.motivo_genérico,
      campos_sugeridos: schema.campos_sugeridos,
      valor_ejemplo: schema.valor_ejemplo
    };
    agregarFilaACoda('nuevoschemas', fila);
  });
}

// -------- ENDPOINT PRINCIPAL --------

app.post('/circleback_webhook', (req, res) => {
  const signature = req.header('x-signature');
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    if (!verifySignature(signature, body)) {
      return res.status(401).json({ error: 'Signature mismatch' });
    }
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    procesarTodoYMandarACoda(data);
    res.json({ status: 'ok' });
  });
});

// -------- INICIA EL SERVIDOR --------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
