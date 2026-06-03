const { sendEmail } = require('../mail/mailer');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Email Delivery Service
 *
 * Wraps the mailer with retry logic. If an email fails, it is retried
 * up to `config.retry.maxAttempts` times with a configurable delay.
 */
class EmailService {
  /**
   * Attempt to deliver an email with automatic retries.
   *
   * @param {object} emailData - Deserialized message from RabbitMQ.
   * @returns {object} Delivery result.
   * @throws {Error} If all retry attempts are exhausted.
   */
  async deliver(emailData) {
    const { correlationId, to, subject } = emailData;
    const maxAttempts = config.retry.maxAttempts;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info(`Delivery attempt ${attempt}/${maxAttempts}`, {
          correlationId,
          to,
          subject,
        });

        const result = await sendEmail(emailData);

        logger.info('Email delivered successfully', {
          correlationId,
          to,
          attempt,
          messageId: result.messageId,
        });

        return { success: true, attempt, messageId: result.messageId };
      } catch (error) {
        lastError = error;

        logger.warn(`Delivery attempt ${attempt}/${maxAttempts} failed`, {
          correlationId,
          to,
          error: error.message,
        });

        // Wait before retrying (skip wait on last attempt)
        if (attempt < maxAttempts) {
          const delay = config.retry.delayMs * attempt; // exponential-ish back-off
          logger.info(`Waiting ${delay}ms before retry`, { correlationId });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    logger.error('All delivery attempts failed — message will be nacked to DLQ', {
      correlationId,
      to,
      error: lastError.message,
      totalAttempts: maxAttempts,
    });

    throw lastError;
  }
}

module.exports = new EmailService();
