import { and, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { db } from "../db/index.js";
import { badgeages, users } from "../db/schema.js";

const profileSchema = z.object({
    name: z.string().trim().max(120).nullable().optional(),
    email: z.string().trim().email().max(254).nullable().or(z.literal("")).optional(),
});

const meRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get("/me", async (request, reply) => {
        const user = requireUser(request);
        return reply.send({
            userId: user.userId,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    });

    fastify.patch(
        "/me",
        {
            schema: {
                body: profileSchema,
            },
        },
        async (request, reply) => {
            const user = requireUser(request);
            const updated = await db
                .update(users)
                .set({
                    name: normalizeOptionalText(request.body.name),
                    email: normalizeOptionalText(request.body.email),
                })
                .where(and(eq(users.id, user.id), eq(users.userId, user.userId)))
                .returning({
                    userId: users.userId,
                    name: users.name,
                    email: users.email,
                    createdAt: users.createdAt,
                })
                .get();

            return reply.send(updated);
        },
    );

    fastify.delete("/me", async (request, reply) => {
        const user = requireUser(request);

        await db.delete(badgeages).where(eq(badgeages.userId, user.id)).run();
        await db
            .delete(users)
            .where(and(eq(users.id, user.id), eq(users.userId, user.userId)))
            .run();

        return reply.status(204).send();
    });
};

function normalizeOptionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

export default meRoutes;