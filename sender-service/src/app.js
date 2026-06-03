const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const emailRoutes = require('./routes/emailRoutes');
const emailController = require('./controllers/emailController');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

/**
 * Express application factory.
 * Sets up middleware, routes, Swagger docs, and error handling.
 */
const app = express();

// ── Security & Parsing ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP Request Logging (pipe Morgan through Winston) ────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ── Swagger UI ────────────────────────────────────────────────────────────
const customSwaggerCss = `
  /* Dark Slate theme for Swagger UI */
  .swagger-ui {
    background-color: #0b0f19 !important;
    color: #cbd5e1 !important;
    font-family: 'Outfit', 'Inter', -apple-system, sans-serif !important;
  }
  .swagger-ui .topbar { display: none !important; }
  .swagger-ui .info { margin: 30px 0 !important; }
  .swagger-ui .info .title { color: #38bdf8 !important; font-size: 32px !important; font-weight: 800 !important; }
  .swagger-ui .info p, .swagger-ui .info a, .swagger-ui .info li, .swagger-ui .info table { color: #94a3b8 !important; font-size: 14px !important; }
  .swagger-ui .scheme-container {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    box-shadow: none !important;
    padding: 15px !important;
  }
  .swagger-ui .opblock-tag {
    color: #e2e8f0 !important;
    border-bottom: 1px solid #334155 !important;
    font-weight: 700 !important;
  }
  .swagger-ui .opblock {
    background: #1e293b !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    border-width: 1px !important;
  }
  .swagger-ui .opblock.opblock-post {
    background: rgba(16, 185, 129, 0.05) !important;
    border-color: #10b981 !important;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #10b981 !important;
    border-radius: 6px !important;
  }
  .swagger-ui .opblock.opblock-get {
    background: rgba(14, 165, 233, 0.05) !important;
    border-color: #0ea5e9 !important;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #0ea5e9 !important;
    border-radius: 6px !important;
  }
  .swagger-ui .opblock .opblock-summary-path {
    color: #f1f5f9 !important;
    font-weight: 600 !important;
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: #94a3b8 !important;
  }
  .swagger-ui .opblock-body pre.microlight {
    background-color: #0f172a !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
    color: #f8fafc !important;
  }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th {
    color: #e2e8f0 !important;
    border-bottom: 1px solid #334155 !important;
  }
  .swagger-ui .parameters-col_name { color: #f1f5f9 !important; font-weight: 600 !important; }
  .swagger-ui .parameter__name.required span { color: #ef4444 !important; }
  .swagger-ui .parameter__type { color: #38bdf8 !important; }
  .swagger-ui .parameter__in { color: #64748b !important; }
  .swagger-ui input[type=text], .swagger-ui textarea {
    background: #0f172a !important;
    color: #f1f5f9 !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
    padding: 8px 12px !important;
  }
  .swagger-ui .btn {
    background: #2563eb !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 6px !important;
    padding: 6px 16px !important;
    transition: all 0.2s ease-in-out !important;
  }
  .swagger-ui .btn:hover {
    background: #1d4ed8 !important;
    transform: translateY(-1px) !important;
  }
  .swagger-ui .btn.execute {
    background: #10b981 !important;
  }
  .swagger-ui .btn.execute:hover {
    background: #059669 !important;
  }
  .swagger-ui section.models {
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    background-color: #1e293b !important;
  }
  .swagger-ui section.models h4 {
    color: #cbd5e1 !important;
    border-bottom: 1px solid #334155 !important;
  }
  .swagger-ui .model-box {
    background-color: #0f172a !important;
    border-radius: 6px !important;
    padding: 10px !important;
  }
  .swagger-ui .model { color: #38bdf8 !important; }
  .swagger-ui .model-title { color: #f1f5f9 !important; }
  .swagger-ui .prop-name { color: #cbd5e1 !important; }
  .swagger-ui .prop-type { color: #38bdf8 !important; }
`;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: customSwaggerCss,
  customSiteTitle: 'Documentation API Service d\'Envoi',
}));

// ── Static Frontend ───────────────────────────────────────────────────────
app.use(express.static('public'));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/email', emailRoutes);
app.get('/health', emailController.healthCheck);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
});

// ── Centralized Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
