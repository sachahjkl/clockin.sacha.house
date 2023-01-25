import { and, asc, between, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { db } from "../db/index.js";
import { badgeages, type Slot } from "../db/schema.js";

const slots: Slot[] = ["firstEntry", "firstExit", "secondEntry", "secondExit"];
const slotSchema = z.enum(["firstEntry", "firstExit", "secondEntry", "secondExit"]);
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const timestampSchema = z.union([z.string(), z.number()]);

function toISODate(date: Date) {
    return date.toISOString().split("T")[0];
}

function parseTimestamp(value: string | number) {
    const date = typeof value === "string" ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp");
    return date.toISOString();
}

const badgeagesRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.route({
		method: "GET",
		url: "/badgeages",
		schema: {
			querystring: z.object({
				from: daySchema.optional(),
				to: daySchema.optional(),
			}),
		},
		handler: async (request, reply) => {
			const user = requireUser(request);
			const now = new Date();
			const from = request.query.from ?? toISODate(now);
			const to = request.query.to ?? toISODate(now);

			const records = await db
				.select()
				.from(badgeages)
				.where(and(eq(badgeages.userId, user.id), between(badgeages.day, from, to)))
				.orderBy(asc(badgeages.day))
				.all();

            return reply.send(records);
		},
	});

    fastify.route({
		method: "POST",
		url: "/badgeages",
		schema: {
			body: z.object({
				timestamp: timestampSchema,
			}),
		},
		handler: async (request, reply) => {
			const user = requireUser(request);
			const timestamp = parseTimestamp(request.body.timestamp);
			const day = toISODate(new Date(timestamp));

			let record = await db
				.select()
				.from(badgeages)
				.where(and(eq(badgeages.userId, user.id), eq(badgeages.day, day)))
				.get();

			if (!record) {
				record = await db
					.insert(badgeages)
					.values({ day, userId: user.id, firstEntry: timestamp })
					.returning()
					.get();
				return reply.status(201).send(record);
			}

			const nextSlot = slots.find((slot) => record[slot] === null);
			if (!nextSlot) {
				return reply.status(409).send({ error: "All slots filled for today" });
			}

			const updated = await db
				.update(badgeages)
				.set({ [nextSlot]: timestamp })
				.where(and(eq(badgeages.userId, user.id), eq(badgeages.id, record.id)))
				.returning()
				.get();

            return reply.status(200).send(updated);
		},
	});

    fastify.route({
		method: "PATCH",
		url: "/badgeages/:id",
		schema: {
			params: z.object({ id: z.coerce.number().int().positive() }),
			body: z.object({
				slot: slotSchema,
				timestamp: timestampSchema,
			}),
		},
		handler: async (request, reply) => {
			const user = requireUser(request);
			const timestamp = parseTimestamp(request.body.timestamp);

			const existing = await db
				.select()
				.from(badgeages)
				.where(and(eq(badgeages.userId, user.id), eq(badgeages.id, request.params.id)))
				.get();
			if (!existing) return reply.status(404).send({ error: "Not found" });

			const updated = await db
				.update(badgeages)
				.set({ [request.body.slot]: timestamp })
				.where(and(eq(badgeages.userId, user.id), eq(badgeages.id, request.params.id)))
				.returning()
				.get();

			return reply.send(updated);
		},
	});

    fastify.route({
		method: "DELETE",
		url: "/badgeages/:id",
		schema: {
			params: z.object({ id: z.coerce.number().int().positive() }),
		},
		handler: async (request, reply) => {
			const user = requireUser(request);

			const existing = await db
				.select()
				.from(badgeages)
				.where(and(eq(badgeages.userId, user.id), eq(badgeages.id, request.params.id)))
				.get();
			if (!existing) return reply.status(404).send({ error: "Not found" });

			await db
				.delete(badgeages)
				.where(and(eq(badgeages.userId, user.id), eq(badgeages.id, request.params.id)))
				.run();

			return reply.status(204).send();
		},
	});
};

export default badgeagesRoutes;
