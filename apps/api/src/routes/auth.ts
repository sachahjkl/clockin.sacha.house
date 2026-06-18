import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { randomInt } from "node:crypto";
import sqids from "sqids";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { translateRequest } from "../translation/index.js";

const encoder = new sqids({ minLength: 8 });

async function generateUniqueUserId(): Promise<string> {
    let attempt = 0;
    while (attempt < 10) {
        const id = encoder.encode([Date.now(), randomInt(1_000_000), attempt]);
        const existing = await db.select().from(users).where(eq(users.userId, id)).get();
        if (!existing) return id;
        attempt++;
    }
    throw new Error("Could not generate unique user id");
}

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post(
        "/auth/account",
        {
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 minute",
                },
            },
        },
        async (_request, reply) => {
            const userId = await generateUniqueUserId();
            const user = await db
                .insert(users)
                .values({ userId })
                .returning({
                    userId: users.userId,
                    name: users.name,
                    email: users.email,
                    createdAt: users.createdAt,
                })
                .get();

            return reply.status(201).send(user);
        },
    );

    fastify.post(
        "/auth/verify",
        {
            schema: {
                body: z.object({ userId: z.string().min(1) }),
            },
        },
        async (request, reply) => {
            const user = await db
                .select()
                .from(users)
                .where(eq(users.userId, request.body.userId))
                .get();
            if (!user) {
                return reply
                    .status(404)
                    .send({ error: translateRequest(request, "errors.accountNotFound") });
            }
            return reply.status(200).send({ exists: true });
        },
    );
};

export default authRoutes;