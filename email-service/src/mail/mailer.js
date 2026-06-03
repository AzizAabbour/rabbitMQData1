const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Nodemailer transporter — configured from environment variables.
 *
 * Supports any SMTP provider (Gmail, Outlook, Brevo, Mailtrap, etc.).
 * For Gmail, use an App Password (not your account password).
 */
const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
  // Connection pool for better performance under load
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Timeouts
  connectionTimeout: 10000, // 10 s
  greetingTimeout: 10000,
  socketTimeout: 30000,
});

/**
 * Verify the SMTP connection on startup.
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    logger.info('SMTP connection verified successfully', {
      host: config.mail.host,
      port: config.mail.port,
    });
    return true;
  } catch (error) {
    logger.error('SMTP connection verification failed', {
      error: error.message,
      host: config.mail.host,
      port: config.mail.port,
    });
    return false;
  }
}

/**
 * Send an email through the configured SMTP transport.
 *
 * @param {object} emailData - { to, subject, message, correlationId }
 * @returns {object} Nodemailer send result
 */
async function sendEmail(emailData) {
  const { to, subject, message, correlationId } = emailData;

  const mailOptions = {
    from: `"Email Service" <${config.mail.from}>`,
    to,
    subject,
    text: message,
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333;">${subject}</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">${message}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">Sent via Cloud Native Email Service | ID: ${correlationId}</p>
    </div>`,
    headers: {
      'X-Correlation-ID': correlationId,
    },
  };

  logger.info('Sending email via SMTP', {
    correlationId,
    to,
    subject,
    host: config.mail.host,
  });

  const result = await transporter.sendMail(mailOptions);

  logger.info('Email sent successfully', {
    correlationId,
    to,
    messageId: result.messageId,
    response: result.response,
  });

  return result;
}

module.exports = { sendEmail, verifyConnection, transporter };
