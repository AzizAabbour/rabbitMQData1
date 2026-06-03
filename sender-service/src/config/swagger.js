const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger / OpenAPI 3.0 specification for the Sender Service.
 * Served at /api-docs via swagger-ui-express.
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Service d\'Envoi d\'E-mails',
      version: '1.0.0',
      description:
        'API REST pour le Service d\'Envoi d\'E-mails. Reçoit les requêtes d\'envoi et les publie dans RabbitMQ pour un traitement asynchrone et fiable.',
      contact: {
        name: 'Équipe Cloud Native',
      },
      license: {
        name: 'Licence MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de Développement Local',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
