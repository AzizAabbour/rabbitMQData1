const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Email Controller — handles HTTP requests for email operations.
 */
class EmailController {
  /**
   * POST /api/email/send
   *
   * Accepts a validated email payload and queues it via RabbitMQ.
   */
  async sendEmail(req, res, next) {
    try {
      const { to, subject, message } = req.body;

      logger.info('Received email send request', { to, subject });

      const result = await emailService.queueEmail({ to, subject, message });

      return res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/email/history
   *
   * Returns a list of recently queued messages.
   */
  async getHistory(_req, res, next) {
    try {
      const history = emailService.getHistory();
      return res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /health
   *
   * Simple liveness probe for Docker and orchestration health checks.
   */
  async healthCheck(_req, res) {
    const producer = require('../rabbitmq/producer');

    return res.status(200).json({
      status: 'UP',
      service: 'sender-service',
      rabbitmq: producer.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new EmailController();
