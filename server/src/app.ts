import * as trpcExpress from '@trpc/server/adapters/express';

import { appRouter } from './routers';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import { createContext } from './trpc';
import dotenv from 'dotenv-flow';
import express from 'express';

// charge les variables dans les fichiers ".env.*" dans l'environnement du processus
dotenv.config();
const PORT = process.env.SERVER_PORT || 4875;

const app = express();

app.use(cors({ credentials: true, origin: process.env.WEB_CLIENT_URL }));
app.use(compression());
app.use(bodyParser.json());

app.use(
	'/trpc',
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext
	})
);

app.listen(PORT, function () {
	console.log(`App is listening on port http://localhost:${PORT} !`);
});
