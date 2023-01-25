import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import staticPlugin from "@fastify/static";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/libsql/migrator";
import { populateUser } from "./auth.js";
import { db } from "./db/index.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import badgeagesRoutes from "./routes/badgeages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "127.0.0.1";
const corsOrigin = process.env.CORS_ORIGIN
	? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
	: false;

const staticPath = process.env.WEB_DIST
    ? path.resolve(process.env.WEB_DIST)
    : path.resolve(__dirname, "../../web/dist/web/browser");

async function main() {
    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../drizzle") });

    const fastify = Fastify({ logger: true });
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);
    fastify.decorateRequest("user", null);
    fastify.addHook("onRequest", populateUser);

    await fastify.register(cors, {
		origin: corsOrigin,
		credentials: Array.isArray(corsOrigin) && corsOrigin.length > 0,
	});
    await fastify.register(rateLimit, { global: false });

    await fastify.register(authRoutes, { prefix: "/api" });
    await fastify.register(meRoutes, { prefix: "/api" });
    await fastify.register(badgeagesRoutes, { prefix: "/api" });

    await fastify.register(staticPlugin, {
        root: staticPath,
        wildcard: false,
    });

    fastify.setNotFoundHandler((request, reply) => {
		if (!request.url.startsWith("/api") && request.method === "GET") {
			return reply.sendFile("index.html", staticPath);
		}

		return reply.status(404).send({ error: "Not found" });
    });

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Clock-in API listening on http://${HOST}:${PORT}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
