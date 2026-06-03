require('dotenv').config();

/**
 * Centralized configuration loaded from environment variables.
 * Never hardcode secrets — all sensitive values come from .env or Docker Compose.
 */
module.exports = {
  // ── Server ────────────────────────────────────────────────────────────
  port: parseInt(process.env.PORT, 10) || 3000,
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
};
