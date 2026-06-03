const logger = require('../utils/logger');

/**
 * Centralized error-handling middleware for the Email Service.
 */
function errorHandler(err, _req, res, _next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.isOperational
      ? err.message
      : 'An unexpected error occurred',
  });
}

module.exports = { errorHandler };
