const { v4: uuidv4 } = require('uuid');
const producer = require('../rabbitmq/producer');
const logger = require('../utils/logger');

/**
 * Email Service — business logic for the Sender Service.
 *
 * Transforms the validated request into a message, attaches metadata
 * (correlation ID, timestamp), and delegates publishing to the producer.
 */
class EmailService {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * Queue an email for asynchronous delivery.
   *
   * @param {object} emailData - Validated { to, subject, message } payload.
   * @returns {object} Response with status and correlationId.
   */
  async queueEmail(emailData) {
    const correlationId = uuidv4();

    const message = {
      correlationId,
      to: emailData.to,
      subject: emailData.subject,
      message: emailData.message,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    logger.info('Queuing email for delivery', {
      correlationId,
      to: emailData.to,
      subject: emailData.subject,
    });

    await producer.publishMessage(message);

    // Save to in-memory history
    this.history.unshift(message);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    logger.info('Email queued successfully', { correlationId });

    return {
      success: true,
      message: 'Email added to queue',
      requestId: correlationId,
    };
  }

  /**
   * Retrieve the queued email history.
   * @returns {Array} Array of email messages.
   */
  getHistory() {
    return this.history;
  }
}

module.exports = new EmailService();
