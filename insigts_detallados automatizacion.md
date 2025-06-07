## PreguntasPendientes

Genera un objeto JSON con los siguientes campos. El campo "pregunta_id" debe ser un hash SHA-1 (en minúsculas) generado a partir de:  
  texto_pregunta + "|" + autor_pregunta + "|" + fecha_registro  
Luego toma los primeros 8 caracteres del hash.

Devuelve solo este JSON:

{
  "pregunta_id": "<hash8>",
  "texto_pregunta": "<texto>",
  "autor_pregunta": "<nombre o email>",
  "contexto": "<texto breve>",
  "estado_actual": "<Abierta, En revisión o Respondida>",
  "fecha_registro": "<YYYY-MM-DD>"
}

## ResumenReunion

Genera un único objeto JSON llamado "resumen_reunion" que consolide la información más relevante de toda la reunión.

Debe incluir los siguientes campos:

1. "reunion_id": hash SHA-1 (en minúsculas) de:  
   titulo_reunion + "|" + fecha_reunion  
   Luego toma los primeros 8 caracteres del hash como ID único de la reunión.

2. "fecha_reunion": en formato ISO (YYYY-MM-DD)

3. "titulo_reunion": resumen breve o nombre significativo de la reunión (por ejemplo: "Sprint 14 / UX + Producto")

4. "resumen_general": un párrafo de 3 a 5 líneas que describa lo más importante discutido en la reunión, incluyendo decisiones, temas claves y resultados.

5. "participantes_principales": lista separada por coma de nombres o emails de quienes hablaron más o lideraron la conversación.

6. "temas_clave": lista separada por coma con entre 3 y 6 temas principales tratados.

7. "decisiones_tomadas": número total de decisiones estratégicas mencionadas.

8. "tareas_identificadas": número total de tareas accionables extraídas.

9. "bloqueos_detectados": número total de bloqueos o riesgos mencionados.

10. "seguimiento_requerido": Yes si se mencionó que debe haber continuidad en próximas reuniones.

11. "proyectos_relacionados": lista separada por coma con los nombres de proyectos o áreas tocadas durante la reunión.

Ejemplo de hash base para "reunion_id":  
  "Sprint 14 UX + Producto|2025-06-04" → SHA-1 → "e6a3d1b..." → reunion_id: "e6a3d1b4"

Devuelve solo este JSON:

{
  "resumen_reunion": {
    "reunion_id": "<hash8>",
    "fecha_reunion": "<YYYY-MM-DD>",
    "titulo_reunion": "<texto>",
    "resumen_general": "<texto largo de 3–5 líneas>",
    "participantes_principales": "<lista separada por coma>",
    "temas_clave": "<lista separada por coma>",
    "decisiones_tomadas": <número>,
    "tareas_identificadas": <número>,
    "bloqueos_detectados": <número>,
    "seguimiento_requerido": <Yes o No>,
    "proyectos_relacionados": "<lista separada por coma>"
  }
}

## DecisionesEstratégicas

Genera un objeto JSON con los siguientes campos. El campo "decision_id" debe ser un hash SHA-1 (en minúsculas) generado a partir de:  
  descripción_decision + "|" + primer participante_clave + "|" + fecha_decision  
Toma los primeros 8 caracteres del hash.

Devuelve solo este JSON:

{
  "decision_id": "<hash8>",
  "tipo_de_insight": "DecisionesEstratégicas",
  "descripcion_decision": "<texto>",
  "justificacion": "<texto breve>",
  "participantes_clave": "<lista separada por coma>",
  "fecha_decision": "<YYYY-MM-DD>",
  "impacto_en": "<texto>",
  "seguimiento_requerido": <Yes o No>,
  "proxima_fecha_revision": "<YYYY-MM-DD o cadena vacía>"
}

## IdeasSeguimientoInfo

Genera un objeto JSON para registrar ideas, seguimientos o información relevante. Usa un campo de ID adaptado al tipo de insight:

- Si el tipo es “Idea”, el ID debe llamarse "idea_id".
- Si el tipo es “Seguimiento”, el ID debe llamarse "seguimiento_id".
- Si el tipo es “Información”, el ID debe llamarse "info_id".

El valor debe generarse como hash SHA-1 (en minúsculas) de:  
  tema_principal + "|" + responsable_directo (o primer participante) + "|" + fecha_reunion  
Toma los primeros 8 caracteres del hash.

Devuelve solo este JSON:

{
  "idea_id": "<hash8>",  // o "seguimiento_id" o "info_id"
  "tipo_de_insight": "<Idea, Seguimiento o Información>",
  "tema_principal": "<texto>",
  "descripcion": "<texto largo>",
  "responsable_directo": "<nombre o email o cadena vacía>",
  "otros_participantes": "<lista separada por coma o cadena vacía>",
  "fecha_reunion": "<YYYY-MM-DD>",
  "notas_adicionales": "<texto opcional>"
}

## RiesgosBloqueos

Genera un objeto JSON con los siguientes campos. El campo "riesgo_id"  debe ser un hash SHA-1 (en minúsculas) generado a partir de:  
  descripcion + "|" + responsable + "|" + fecha_identificacion  
Toma los primeros 8 caracteres del hash.

Si el tipo es “Riesgo”, usa "riesgo_id". Si es “Bloqueo”, usa "bloqueo_id".

Devuelve solo este JSON:

{
  "riesgo_id": "<hash8>",    // o vacio
 "bloqueo_id":  <hash8>",    // o vacio
  "tipo": "<Riesgo o Bloqueo>",
  "descripcion": "<texto>",
  "origen": "<Recursos, Cliente, Técnico u Otro>",
  "impacto_posible": "<Alto, Medio o Bajo>",
  "accion_recomendada": "<texto breve>",
  "responsable": "<nombre o email>",
  "fecha_identificacion": "<YYYY-MM-DD>"
}

## NuevoSchemaReunion

Este insight sirve para detectar fragmentos de información discutidos en la reunión que **no encajan** claramente en las siguientes categorías:  
“Tarea”, “Decision”, “Idea”, “Bloqueo”, “Seguimiento”, “Riesgo”, “Informacion”, “Preguntas Pendientes”, “Feedback”, “ResumenReunion”, “DecisionesEstrategicas”.

Cuando eso ocurra, genera un único objeto JSON llamado "nuevo_schema" con la siguiente estructura:

1. "schema_id": hash SHA-1 (en minúsculas) de:  
   resumen_fragmento + "|" + primer_participante + "|" + fecha_reunion  
   Luego toma los primeros 8 caracteres del SHA-1 como ID.

2. "motivo_genérico": texto corto explicando por qué el fragmento no encaja en ninguna categoría conocida (ej. “Este fragmento describe una métrica interna no clasificable como tarea o decisión.”)

3. "campos_sugeridos": array de objetos donde cada uno representa un campo sugerido para crear una nueva tabla.  
Cada campo debe tener:
  - "campo": nombre de la columna sugerida (formato snake_case, sin espacios).
  
  - "descripción": breve explicación de lo que debe contener ese campo.

4. "valor_ejemplo": objeto con 1–3 pares clave-valor que sirvan como ejemplo real extraído de la reunión.

Devuelve el siguiente JSON (sin texto adicional):

{
  "nuevo_schema": {
    "schema_id": "<hash8>",
    "motivo_generico": "<explicación breve>",
    "campos_sugeridos": [
      {
        "campo": "<nombre_columna_1>",
        "tipo_dato": "<Text / Number / Yes or No>",
        "descripción": "<explicación breve>"
      },
      ...
    ],
    "valor_ejemplo": {
      "<nombre_columna_1>": <valor ejemplo>,
      "<nombre_columna_2>": <valor ejemplo>
    }
  }
}

## insight_detallado

Genera un objeto JSON con los siguientes campos. El campo "insight_id" debe ser un hash SHA-1 (en minúsculas) generado a partir de:  
  tema_principal + "|" + responsable_directo + "|" + "tipo_de_insight"
Luego toma los primeros 8 caracteres hexadecimales del SHA-1 para formar el insight_id.

Devuelve solo este JSON:

{
  "insight_id": "<hash8>",
  "tipo_de_insight": "Tarea",
  "tema_principal": "<texto>",
 "resumen": "<texto corto>",
  "descripcion_completa": "<texto largo>",
  "responsable_directo": "<nombre o email>",
  "otros_participantes": "<lista separada por coma>",
  "fecha_limite": "<YYYY-MM-DD o cadena vacía>",
  "proyecto_o_area_relacionada": "<texto>",
  "impacto_importancia": "<Alta, Media o Baja>",
  "requiere_seguimiento": <Yes o No>,
  "notas_adicionales": "<texto opcional>"
}

## Feedback

Genera un objeto JSON con los siguientes campos. El campo "feedback_id" debe ser un hash SHA-1 (en minúsculas) generado a partir de:  
  texto_feedback + "|" + autor_feedback + "|" + fecha_feedback  
Toma los primeros 8 caracteres del hash.

Devuelve solo este JSON:

{
  "feedback_id": "<hash8>",
  "autor_feedback": "<nombre o email>",
  "texto_feedback": "<texto breve>",
  "categoria": "<Proceso, Herramientas, Comunicación u Otro>",
  "urgencia": "<Alta, Media o Baja>",
  "fecha_feedback": "<YYYY-MM-DD>"
}

## Tarea

Crea este insight cada vez que en la conversación se identifique una acción concreta, compromiso, responsabilidad o tarea específica que deba realizarse después de la reunión. Esto incluye promesas, asignaciones, decisiones de hacer algo, o solicitudes de seguimiento.
 El campo "tarea_id" debe ser un hash SHA-1 (en minúsculas) generado a partir de:  
  tema_principal + "|"   descripcion_completa    + "|"  + responsable_directo 
Luego toma los primeros 8 caracteres hexadecimales del SHA-1 para formar el tarea_id.
Criterios para detección:

    Frases como: "yo me encargo", "quedamos en que", "tienes que", "hay que", "para el lunes", "lo reviso", "te toca a ti", etc.

    Mención de una persona + verbo en futuro o modo imperativo + acción específica.

    Asociaciones con proyectos, entregables, tareas administrativas, coordinación, seguimiento, etc.

Formato de salida esperado:

{
  "tarea_id": "string",                        // ID único generado automáticamente
  "tema_principal": "string",                 // Tema general al que pertenece la tarea
  "descripcion_completa": "string",           // Explicación clara y detallada de lo que se debe hacer
  "responsable_directo": "string",            // Nombre de la persona encargada de ejecutar la tarea
  "otros_participantes": ["string", ...],     // Otros mencionados como involucrados
  "fecha_limite": "YYYY-MM-DD",               // Fecha concreta si se menciona, o estimada si es posible inferirla
  "proyecto_o_area_relacionada": "string",    // Área, equipo o proyecto afectado (si se menciona)
  "impacto_importancia": "Alta | Media | Baja", // Nivel de impacto según el contexto
  "requiere_seguimiento": true | false,       // Indica si debe revisarse en una próxima reunión
  "notas_adicionales": "string"               // Cualquier detalle adicional útil para ejecución o monitoreo
}

Ejemplo generado:

{
  "tarea_id": "task-20250601-001",
  "tema_principal": "Implementación de herramientas",
  "descripcion_completa": "Configurar y probar la integración del webhook con Coda antes del miércoles.",
  "responsable_directo": "Gael Flores Gonzáles",
  "otros_participantes": ["Ernesto Hernández Martínez"],
  "fecha_limite": "2025-06-05",
  "proyecto_o_area_relacionada": "Automatización de reuniones",
  "impacto_importancia": "Alta",
  "requiere_seguimiento": true,
  "notas_adicionales": "Esto es clave para la prueba del viernes y para decidir si seguimos usando Circleback."
}

## Endpoint url ejemplo 
https://37ac-201-141-105-14.ngrok-free.app/circleback_webhook