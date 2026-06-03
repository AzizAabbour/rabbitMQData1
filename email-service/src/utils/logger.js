const winston = require('winston');
const path = require('path');

/**
 * Winston logger for the Email Service.
 * Mirrors the Sender Service logger for consistent log format across microservices.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-service' },
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, correlationId, ...meta }) => {
          const corrId = correlationId ? ` [${correlationId}]` : '';
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${service}] ${level}:${corrId} ${message}${extra}`;
        })
      ),
    })
  );
}

module.exports = logger;
