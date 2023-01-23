import express, { NextFunction, Request, Response } from 'express';

import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' assert { type: 'json' };

export const router = express.Router();

const options = {
	explorer: true
};
router.use('/api-docs', swaggerUi.serve);
router.get(
	'/api-docs',
	swaggerUi.setup(swaggerDocument, options)
	// #swagger.tags = ['documentation']
);

import { router as v1 } from './routes/v1.js';
import { router as v2 } from './routes/v2.js';
// import { router as docs } from './routes/docs.js';

router.use(cors());
router.use(
	'/v1',
	v1
	// #swagger.tags = ['v1']
);
router.use(
	'/v2',
	v2

	// #swagger.tags = ['v2']
);

router.get('/', function (_, res) {
	// #swagger.tags = ['redirect']
	return res.redirect('/api-docs');
});

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	res.status(500).render('error', {
		status: res.statusCode,
		message: err.message,
		stack: err.stack
	});
});

router.use(function (req, res, _next) {
	res.status(404).render('error', {
		status: res.statusCode,
		message: `Page ${req.url} introuvable`,
		stack: null
	});
});
