const app = require('./app');
const config = require('./config');
const producer = require('./rabbitmq/producer');
const logger = require('./utils/logger');

/**
 * Server entry point.
 *
 * 1. Connects to RabbitMQ.
 * 2. Starts the Express HTTP server.
 * 3. Registers graceful shutdown handlers.
 */
async function start() {
  try {
    // ── Connect to RabbitMQ ─────────────────────────────────────────────
    await producer.connect();

    // ── Start HTTP Server ───────────────────────────────────────────────
    const server = app.listen(config.port, () => {
      logger.info(`Sender Service started`, {
        port: config.port,
        env: config.nodeEnv,
        swagger: `http://localhost:${config.port}/api-docs`,
        health: `http://localhost:${config.port}/health`,
      });
    });

    // ── Graceful Shutdown ───────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await producer.close();
        logger.info('All connections closed — exiting');
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ── Unhandled Rejection / Exception Guards ──────────────────────────
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason: String(reason) });
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start Sender Service', { error: error.message });
    process.exit(1);
  }
}

start();
