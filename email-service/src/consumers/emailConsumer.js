const amqplib = require('amqplib');
const config = require('../config');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * RabbitMQ Consumer
 *
 * Connects to RabbitMQ, asserts the required topology (exchange, queue, DLQ),
 * and continuously listens for email messages.
 *
 * Message acknowledgment strategy:
 *  - ack()   → message processed successfully
 *  - nack(false, false) → send to DLQ (all retries exhausted)
 */
class EmailConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  /**
   * Connect to RabbitMQ and start consuming.
   */
  async connect() {
    try {
      logger.info('Connecting to RabbitMQ...', { url: config.rabbitmq.url });

      this.connection = await amqplib.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Limit unacknowledged messages for back-pressure
      await this.channel.prefetch(config.rabbitmq.prefetch);

      // ── Assert Dead Letter Exchange & Queue ─────────────────────────
      await this.channel.assertExchange(config.rabbitmq.dlqExchange, 'direct', {
        durable: true,
      });
      await this.channel.assertQueue(config.rabbitmq.dlq, { durable: true });
      await this.channel.bindQueue(
        config.rabbitmq.dlq,
        config.rabbitmq.dlqExchange,
        config.rabbitmq.dlqRoutingKey
      );

      // ── Assert Main Exchange & Queue ────────────────────────────────
      await this.channel.assertExchange(config.rabbitmq.exchange, 'direct', {
        durable: true,
      });
      await this.channel.assertQueue(config.rabbitmq.queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': config.rabbitmq.dlqExchange,
          'x-dead-letter-routing-key': config.rabbitmq.dlqRoutingKey,
        },
      });
      await this.channel.bindQueue(
        config.rabbitmq.queue,
        config.rabbitmq.exchange,
        config.rabbitmq.routingKey
      );

      this.isConnected = true;
      logger.info('Connected to RabbitMQ — starting consumer');

      // ── Start consuming ─────────────────────────────────────────────
      await this.startConsuming();

      // ── Handle disconnects ──────────────────────────────────────────
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err.message });
        this.isConnected = false;
      });
      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed — scheduling reconnect');
        this.isConnected = false;
        setTimeout(() => this.connect(), config.rabbitmq.reconnectDelay);
      });
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error: error.message });
      this.isConnected = false;
      setTimeout(() => this.connect(), config.rabbitmq.reconnectDelay);
    }
  }

  /**
   * Register the message handler on the queue.
   */
  async startConsuming() {
    logger.info(`Listening on queue: ${config.rabbitmq.queue}`);

    await this.channel.consume(config.rabbitmq.queue, async (msg) => {
      if (!msg) return;

      const correlationId = msg.properties.correlationId || 'unknown';

      try {
        const emailData = JSON.parse(msg.content.toString());

        logger.info('Message received from queue', {
          correlationId,
          to: emailData.to,
          subject: emailData.subject,
        });

        // Deliver with retry logic
        await emailService.deliver(emailData);

        // Acknowledge successful processing
        this.channel.ack(msg);
        logger.info('Message acknowledged', { correlationId });

      } catch (error) {
        logger.error('Failed to process message — sending to DLQ', {
          correlationId,
          error: error.message,
        });

        // Reject without requeue → routes to DLQ via dead-letter exchange
        this.channel.nack(msg, false, false);
      }
    });
  }

  /**
   * Gracefully close channel and connection.
   */
  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.isConnected = false;
      logger.info('RabbitMQ connection closed gracefully');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error: error.message });
    }
  }
}

const consumer = new EmailConsumer();
module.exports = consumer;
