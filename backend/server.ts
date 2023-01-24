import * as router from './router';

import { PrismaClient } from '@prisma/client';
import cors from '@fastify/cors';
import { createContext } from './trpc';
import dotenv from 'dotenv-flow';
import fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';

const prisma = new PrismaClient();

dotenv.config();

const dev = !JSON.parse(process.env['PROD'] || 'false');
const port = parseInt(process.env['SERVER_PORT'] || '4583');

function createServer() {
	const server = fastify({ logger: dev });

	server.register(cors, {
		origin: true
	});
	server.register(fastifyTRPCPlugin, {
		prefix: '/trpc',
		trpcOptions: {
			router: router.appRouter,
			createContext
		}
	});

	server.get('/', async () => {
		return { hello: 'wait-on 💨' };
	});

	const stop = () => server.close();
	const start = async () => {
		try {
			await server.listen({ port });
			console.log('listening on port', port);
		} catch (err) {
			server.log.error(err);
			process.exit(1);
		}
	};
	return { server, start, stop };
}

createServer()
	.start()
	.then(async () => {
		console.log(`server starter on port ${port}`);
	})
	.catch((e) => {
		console.error('server crashed', e);
	})
	.finally(async () => {
		await prisma.$disconnect();
		process.exit(1);
	});

export * from './router';
