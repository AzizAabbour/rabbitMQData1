const amqplib = require('amqplib');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * RabbitMQ Producer
 *
 * Manages a single persistent connection and channel to RabbitMQ.
 * Ensures the exchange, queue, DLQ, and bindings exist before publishing.
 * Automatically reconnects on connection loss.
 */
class RabbitMQProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  /**
   * Connect to RabbitMQ and assert all topology (exchange, queue, DLQ, bindings).
   */
  async connect() {
    try {
      logger.info('Connecting to RabbitMQ...', { url: config.rabbitmq.url });

      this.connection = await amqplib.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // ── Assert Dead Letter Exchange & Queue ─────────────────────────
      await this.channel.assertExchange(config.rabbitmq.dlqExchange, 'direct', {
        durable: true,
      });
      await this.channel.assertQueue(config.rabbitmq.dlq, {
        durable: true,
      });
      await this.channel.bindQueue(
        config.rabbitmq.dlq,
        config.rabbitmq.dlqExchange,
        config.rabbitmq.dlqRoutingKey
      );

      // ── Assert Main Exchange & Queue (with DLQ forwarding) ──────────
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
      logger.info('Connected to RabbitMQ successfully');

      // ── Handle unexpected disconnects ───────────────────────────────
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
      // Retry after delay
      setTimeout(() => this.connect(), config.rabbitmq.reconnectDelay);
    }
  }

  /**
   * Publish a JSON message to the email exchange.
   *
   * @param {object} message - The email message payload.
   * @returns {boolean} Whether the publish succeeded.
   */
  async publishMessage(message) {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    try {
      const content = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        config.rabbitmq.exchange,
        config.rabbitmq.routingKey,
        content,
        {
          persistent: true, // survive broker restarts
          contentType: 'application/json',
          correlationId: message.correlationId,
          timestamp: Date.now(),
        }
      );

      if (published) {
        logger.info('Message published to RabbitMQ', {
          correlationId: message.correlationId,
          to: message.to,
          subject: message.subject,
        });
      } else {
        logger.warn('Channel write buffer full — message may be delayed', {
          correlationId: message.correlationId,
        });
      }

      return published;
    } catch (error) {
      logger.error('Failed to publish message', {
        correlationId: message.correlationId,
        error: error.message,
      });
      throw error;
    }
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

// Singleton instance
const producer = new RabbitMQProducer();

module.exports = producer;
