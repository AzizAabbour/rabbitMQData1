const express = require('express');
const emailController = require('../controllers/emailController');
const { validateEmail } = require('../middleware/validateRequest');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailRequest:
 *       type: object
 *       required:
 *         - to
 *         - subject
 *         - message
 *       properties:
 *         to:
 *           type: string
 *           format: email
 *           description: Recipient email address
 *           example: client@example.com
 *         subject:
 *           type: string
 *           description: Email subject line
 *           example: Welcome
 *         message:
 *           type: string
 *           description: Email message body
 *           example: Hello from RabbitMQ
 *     EmailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Email added to queue
 *         requestId:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: UP
 *         service:
 *           type: string
 *           example: sender-service
 *         rabbitmq:
 *           type: string
 *           example: CONNECTED
 *         timestamp:
 *           type: string
 *           format: date-time
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/email/send:
 *   post:
 *     summary: Queue an email for asynchronous delivery
 *     description: Validates the request, generates a correlation ID, and publishes the message to RabbitMQ.
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *     responses:
 *       202:
 *         description: Email accepted and queued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.post('/send', validateEmail, emailController.sendEmail);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the Sender Service and its RabbitMQ connection.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

module.exports = router;
