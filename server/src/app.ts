import express from 'express';
import dotenv from 'dotenv-flow';
import { router } from './router.js';

// charge les variables dans les fichiers ".env.*" dans l'environnement du processus
dotenv.config();
const port = process.env.PORT || process.env.LOCAL_PORT || 4875;

const app = express();
app.set('view engine', 'ejs');

app.use(router);

app.listen(port, function () {
	console.log(`App is listening on port http://localhost:${port} !`);
});
