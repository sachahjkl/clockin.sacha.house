// const swaggerAutogen = require('swagger-autogen')();
import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv-flow';
dotenv.config();
const port = process.env.PORT || process.env.LOCAL_PORT || 4875;

const doc = {
	info: {
		version: '1.0.0', // by default: '1.0.0'
		title: 'api.cassini', // by default: 'REST API'
		description: 'API de CASSINI' // by default: ''
	},
	host: `localhost:${port}`, // by default: 'localhost:3000'
	basePath: '', // by default: '/'
	schemes: [], // by default: ['http']
	consumes: [], // by default: ['application/json']
	produces: [], // by default: ['application/json']
	tags: [
		// by default: empty Array
		{
			name: '', // Tag name
			description: '' // Tag description
		}
		// { ... }
	],
	securityDefinitions: {}, // by default: empty object
	definitions: {}, // by default: empty object (Swagger 2.0)
	components: {} // by default: empty object (OpenAPI 3.x)
};

const outputFile = './src/swagger.json';
const endpointsFiles = ['./src/app.ts'];

swaggerAutogen({ language: 'fr-FR' })(outputFile, endpointsFiles, doc);
