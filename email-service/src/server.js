const app = require('./app');
const config = require('./config');
const consumer = require('./consumers/emailConsumer');
const { verifyConnection } = require('./mail/mailer');
const logger = require('./utils/logger');

/**
 * Email Service entry point.
 *
 * 1. Verifies SMTP connectivity.
 * 2. Connects to RabbitMQ and starts consuming.
 * 3. Starts the Express HTTP server (health checks).
 * 4. Registers graceful shutdown handlers.
 */
async function start() {
  try {
    // ── Verify SMTP ───────────────────────────────────────────────────
    const smtpReady = await verifyConnection();
    if (!smtpReady) {
      logger.warn('SMTP verification failed — emails may fail until SMTP is reachable');
    }

    // ── Connect to RabbitMQ & start consuming ─────────────────────────
    await consumer.connect();

    // ── Start HTTP Server (health endpoint) ───────────────────────────
    const server = app.listen(config.port, () => {
      logger.info('Email Service started', {
        port: config.port,
        env: config.nodeEnv,
        health: `http://localhost:${config.port}/health`,
      });
    });

    // ── Graceful Shutdown ─────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await consumer.close();
        logger.info('All connections closed — exiting');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason: String(reason) });
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start Email Service', { error: error.message });
    process.exit(1);
  }
}

start();
