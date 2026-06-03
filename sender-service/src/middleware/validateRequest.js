const { emailSchema } = require('../validators/emailValidator');
const logger = require('../utils/logger');

/**
 * Express middleware that validates the request body against the Joi email schema.
 * Returns 400 with structured errors on validation failure.
 */
function validateEmail(req, res, next) {
  const { error, value } = emailSchema.validate(req.body, {
    abortEarly: false,   // collect all errors, not just the first
    stripUnknown: true,  // remove unexpected fields
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);

    logger.warn('Email validation failed', {
      errors,
      body: req.body,
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Replace body with the validated & sanitized value
  req.body = value;
  next();
}

module.exports = { validateEmail };
