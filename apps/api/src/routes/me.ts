import { and, asc, between, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { db } from "../db/index.js";
import { badgeages, users } from "../db/schema.js";
import { sendDemoClockinPageDataIfNeeded } from "./demo-me.js";
import { sendDemoReadOnlyIfNeeded } from "./demo-response.js";

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

    fastify.get(
        "/clockin-page-data",
        async (request, reply) => {
            const user = requireUser(request);
            const { from, to } = weekRange();

            if (sendDemoClockinPageDataIfNeeded(reply, user, from, to)) {
                return;
            }

            const records = await db
                .select()
                .from(badgeages)
                .where(and(eq(badgeages.userId, user.id), between(badgeages.day, from, to)))
                .orderBy(asc(badgeages.day))
                .all();

            return reply.send({
                profile: {
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                },
                badgeages: records,
            });
        },
    );

    fastify.patch(
        "/me",
        {
            schema: {
                body: profileSchema,
            },
        },
        async (request, reply) => {
            const user = requireUser(request);
            if (sendDemoReadOnlyIfNeeded(request, reply, user)) {
                return;
            }

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
        if (sendDemoReadOnlyIfNeeded(request, reply, user)) {
            return;
        }

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

function weekRange(from?: string, to?: string): { from: string; to: string } {
    if (from && to) {
        return { from, to };
    }

    const start = startOfWorkWeek();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        from: from ?? toISODate(start),
        to: to ?? toISODate(end),
    };
}

function toISODate(date: Date): string {
    return date.toISOString().split("T")[0];
}

function startOfWorkWeek(): Date {
    const start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return start;
}

export default meRoutes;
