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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sender Service API Docs',
}));

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
