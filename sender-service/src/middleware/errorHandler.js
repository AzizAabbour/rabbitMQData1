const logger = require('../utils/logger');

/**
 * Centralized error-handling middleware.
 * Must be registered AFTER all routes in Express.
 *
 * Catches both operational errors (known) and programmer errors (unknown),
 * logs them, and returns a consistent JSON error response.
 */
function errorHandler(err, _req, res, _next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Custom application error class for operational errors.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
