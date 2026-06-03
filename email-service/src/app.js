const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

/**
 * Express application for the Email Service.
 * Provides health-check and monitoring endpoints only (no public API).
 * The actual work is done by the RabbitMQ consumer.
 */
const app = express();

// ── Security & Parsing ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── HTTP Logging ──────────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const consumer = require('./consumers/emailConsumer');
  const { transporter } = require('./mail/mailer');

  res.status(200).json({
    status: 'UP',
    service: 'email-service',
    rabbitmq: consumer.isConnected ? 'CONNECTED' : 'DISCONNECTED',
    smtp: transporter.isIdle() ? 'IDLE' : 'ACTIVE',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// ── Error Handler ─────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
