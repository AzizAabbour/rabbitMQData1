require('dotenv').config();

/**
 * Centralized configuration for the Email Service.
 * All sensitive values (SMTP credentials) come from environment variables.
 */
module.exports = {
  // ── Server ────────────────────────────────────────────────────────────
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // ── RabbitMQ ──────────────────────────────────────────────────────────
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    exchange: process.env.RABBITMQ_EXCHANGE || 'email_exchange',
    queue: process.env.RABBITMQ_QUEUE || 'email_queue',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'email.send',
    dlq: process.env.RABBITMQ_DLQ || 'email_dlq',
    dlqExchange: process.env.RABBITMQ_DLQ_EXCHANGE || 'email_dlq_exchange',
    dlqRoutingKey: process.env.RABBITMQ_DLQ_ROUTING_KEY || 'email.dlq',
    reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY, 10) || 5000,
    prefetch: parseInt(process.env.RABBITMQ_PREFETCH, 10) || 1,
  },

  // ── SMTP / Mail ───────────────────────────────────────────────────────
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true', // true for 465, false for others
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
  },

  // ── Retry ─────────────────────────────────────────────────────────────
  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS, 10) || 3,
    delayMs: parseInt(process.env.RETRY_DELAY_MS, 10) || 2000,
  },
};
