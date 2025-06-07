# Circleback → Coda Webhook

Este proyecto recibe `webhooks` de la plataforma [Circleback.ai](https://circleback.ai) y los convierte en inserciones automáticas en múltiples tablas de un documento en [Coda.io](https://coda.io).

## ✅ Funcionalidades actuales

- 🔐 Verificación de firmas HMAC (opcional) desde `x-signature`
- 📨 Recepción de payloads JSON directamente desde Circleback (`application/json`)
- 🧰 Conversión estructurada de insights en:
  - Tarea  
  - PreguntasPendientes  
  - Feedback  
  - RiesgosBloqueos  
  - DecisionesEstratégicas  
  - IdeasSeguimientoInfo  
  - ResumenReunion  
  - NuevoSchemaReunion  
  - insight_detallado  
- 📤 Inserción por lotes (máx. 25 filas) con `axios` hacia la API de Coda
- 🔁 Retries automáticos con backoff en caso de errores `429 Too Many Requests`
- 💾 Registro automático de cada payload recibido (`payload_TIMESTAMP.json`)

## 🗂️ Estructura del proyecto

.
├── index.js # Lógica principal del servidor y webhook
├── .env # Variables de entorno (token, doc_id, ids de tablas)
├── payload_*.json # Archivos de respaldo con payloads reales
└── README.md # Este archivo


## ⚙️ Requisitos

- Node.js 18+
- Cuenta en Coda.io con API Token válido
- Documento de Coda con IDs de tablas bien definidos
- Cuenta en Circleback con plan que permita webhooks

## 🔧 Configuración `.env`

```env
CODA_API_TOKEN=xxx
CODA_DOC_ID=xxx
CODA_TABLE_TAREAS_ID=xxx
CODA_TABLE_PREGUNTAS_ID=xxx
CODA_TABLE_FEEDBACK_ID=xxx
CODA_TABLE_RIESGOS_ID=xxx
CODA_TABLE_DECISIONES_ID=xxx
CODA_TABLE_IDEAS_ID=xxx
CODA_TABLE_RESUMEN_ID=xxx
CODA_TABLE_NUEVOSTEMAS_ID=xxx
CODA_TABLE_INSIGHTS_ID=xxx
CIRCLEBACK_SECRET=tu_firma_opcional
```

## 🚀 Uso

npm install
node index.js
Luego activa tu webhook en Circleback apuntando a:

https://<tu_ngrok_o_dominio>/circleback_webhook

### 🧪 Testing
Puedes simular un POST local con:

curl -X POST http://localhost:3000/circleback_webhook \-H "Content-Type: application/json" \-d @payload_de_ejemplo.json


"" 📌 Notas
Se normalizan claves para evitar errores con los nombres de insight (Tarea, Feedback, etc.)

Los insights deben estar bien formateados para que se llenen correctamente en Coda

Cada tipo de insight usa su propio column_id esperado por Coda

---

