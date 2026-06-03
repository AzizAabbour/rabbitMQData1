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
 *           description: Adresse e-mail du destinataire
 *           example: client@example.com
 *         subject:
 *           type: string
 *           description: Objet du message
 *           example: Bienvenue
 *         message:
 *           type: string
 *           description: Corps du message e-mail
 *           example: Bonjour de RabbitMQ
 *     EmailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: E-mail ajouté à la file d'attente
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
 *     summary: Ajouter un e-mail à la file d'attente d'envoi
 *     description: Valide la requête, génère un ID de corrélation et publie le message sur RabbitMQ.
 *     tags: [E-mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *     responses:
 *       202:
 *         description: E-mail accepté et mis en file d'attente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         description: Erreur de validation des données
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/send', validateEmail, emailController.sendEmail);

/**
 * @swagger
 * /api/email/history:
 *   get:
 *     summary: Récupérer l'historique des e-mails envoyés (mémoire)
 *     description: Retourne la liste des e-mails récemment envoyés ou mis en file d'attente.
 *     tags: [E-mail]
 *     responses:
 *       200:
 *         description: Liste de l'historique récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EmailResponse'
 */
router.get('/history', emailController.getHistory);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérification de l'état du service (Santé)
 *     description: Retourne l'état de santé du service d'envoi et de sa connexion à RabbitMQ.
 *     tags: [Santé]
 *     responses:
 *       200:
 *         description: Le service est en bonne santé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

module.exports = router;
