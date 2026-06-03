const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger / OpenAPI 3.0 specification for the Sender Service.
 * Served at /api-docs via swagger-ui-express.
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sender Service API',
      version: '1.0.0',
      description:
        'REST API for the Email Sender Service. Accepts email requests and publishes them to RabbitMQ for asynchronous delivery.',
      contact: {
        name: 'Cloud Native Team',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
