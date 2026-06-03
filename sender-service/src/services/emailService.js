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

    logger.info('Email queued successfully', { correlationId });

    return {
      success: true,
      message: 'Email added to queue',
      requestId: correlationId,
    };
  }
}

module.exports = new EmailService();
