const Joi = require('joi');

/**
 * Joi validation schema for the email send request.
 *
 * Rules:
 *  - `to`      : valid email, required
 *  - `subject` : string, 1–255 chars, required
 *  - `message` : string, 1–10 000 chars, required
 */
const emailSchema = Joi.object({
  to: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Recipient must be a valid email address',
      'any.required': 'Recipient email address is required',
      'string.empty': 'Recipient email address cannot be empty',
    }),

  subject: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Subject must be at least 1 character',
      'string.max': 'Subject must not exceed 255 characters',
      'any.required': 'Email subject is required',
      'string.empty': 'Email subject cannot be empty',
    }),

  message: Joi.string()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.min': 'Message must be at least 1 character',
      'string.max': 'Message must not exceed 10,000 characters',
      'any.required': 'Email message body is required',
      'string.empty': 'Email message body cannot be empty',
    }),
});

module.exports = { emailSchema };
