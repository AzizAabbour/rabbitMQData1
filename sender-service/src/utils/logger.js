const winston = require('winston');
const path = require('path');

/**
 * Winston logger configured with:
 *  - Console transport (colorized, simple format)
 *  - File transports for combined and error logs
 *  - Timestamps, service label, and structured JSON for files
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sender-service' },
  transports: [
    // ── Write all logs to combined.log ──────────────────────────────────
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5 MB
      maxFiles: 5,
    }),
    // ── Write error-level logs to error.log ─────────────────────────────
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// In non-production environments, also log to the console with color
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
