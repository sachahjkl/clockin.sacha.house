import { and, asc, between, count, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as XLSX from "xlsx";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { db } from "../db/index.js";
import { pointages, type Pointage, type Slot } from "../db/schema.js";
import { historyDefaultRange } from "../demo.js";
import { localeFor, translate, translateRequest, type Language } from "../translation/index.js";
import {
    demoExportRows,
    sendDemoHistoryPageIfNeeded,
    sendDemoPointagesExportIfNeeded,
} from "./demo-pointages.js";
import { sendDemoReadOnlyIfNeeded } from "./demo-response.js";

const slots: Slot[] = ["firstEntry", "firstExit", "secondEntry", "secondExit"];
const slotSchema = z.enum(["firstEntry", "firstExit", "secondEntry", "secondExit"]);
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const timestampSchema = z.union([z.string(), z.number()]);
const exportFormatSchema = z.enum(["csv", "xlsx"]);
const exportLanguageSchema = z.enum(["fr", "en"]);
const exportIsoSchema = z.preprocess(
    (value) => (value === undefined ? "false" : value),
    z.enum(["true", "false"]).transform((value) => value === "true"),
);

function toISODate(date: Date) {
    return date.toISOString().split("T")[0];
}

function parseTimestamp(value: string | number) {
    const date = typeof value === "string" ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp");
    return date.toISOString();
}

function exportHeaders(language: Language) {
    return [
        translate(language, "export.pointages.headers.day"),
        translate(language, "export.pointages.headers.firstEntry"),
        translate(language, "export.pointages.headers.firstExit"),
        translate(language, "export.pointages.headers.secondEntry"),
        translate(language, "export.pointages.headers.secondExit"),
        translate(language, "export.pointages.headers.total"),
    ];
}

function formatExportTime(value: string | null, language: Language, iso: boolean) {
    if (!value) return "";
    if (iso) return value;
    return new Intl.DateTimeFormat(localeFor(language), {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date(value));
}

function formatExportDay(value: string, language: Language, iso: boolean) {
    if (iso) return value;
    return new Intl.DateTimeFormat(localeFor(language), {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

function computeTotalSeconds(record: Pointage) {
    let totalSeconds = 0;
    for (let i = 0; i < slots.length; i += 2) {
        const start = record[slots[i]];
        const end = record[slots[i + 1]];
        if (start && end) {
            totalSeconds += Math.max(
                0,
                Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000),
            );
        }
    }

    return totalSeconds;
}

function formatDuration(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

function buildExportRows(records: Pointage[], language: Language, iso: boolean) {
    const headers = exportHeaders(language);
    const rows = records.map((record) => ({
        [headers[0]]: formatExportDay(record.day, language, iso),
        [headers[1]]: formatExportTime(record.firstEntry, language, iso),
        [headers[2]]: formatExportTime(record.firstExit, language, iso),
        [headers[3]]: formatExportTime(record.secondEntry, language, iso),
        [headers[4]]: formatExportTime(record.secondExit, language, iso),
        [headers[5]]: formatDuration(computeTotalSeconds(record)),
    }));

    rows.push({
        [headers[0]]: translate(language, "export.pointages.rows.total"),
        [headers[1]]: "",
        [headers[2]]: "",
        [headers[3]]: "",
        [headers[4]]: "",
        [headers[5]]: formatDuration(
            records.reduce((total, record) => total + computeTotalSeconds(record), 0),
        ),
    });

    return rows;
}

function toCsv(rows: Array<Record<string, string>>, headers: string[]) {
    const lines = [headers.join(";")];

    for (const row of rows) {
        lines.push(headers.map((header) => escapeCsvValue(row[header] ?? "")).join(";"));
    }

    return lines.join("\n");
}

function escapeCsvValue(value: string) {
    if (value.includes(";") || value.includes('"') || value.includes("\n")) {
        return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
}

const pointagesRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.route({
        method: "GET",
        url: "/pointages/export",
        schema: {
            querystring: z.object({
                from: daySchema,
                to: daySchema,
                format: exportFormatSchema,
                lang: exportLanguageSchema.default("fr"),
                iso: exportIsoSchema,
            }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            const { from, to, format, lang, iso } = request.query;

            if (
                sendDemoPointagesExportIfNeeded(reply, user, {
                    format,
                    from,
                    to,
                    lang,
                    iso,
                    buildRows: (demoUser, exportFrom, exportTo, exportLang) =>
                        buildExportRows(demoExportRows(demoUser, exportFrom, exportTo), exportLang, iso),
                    headers: exportHeaders,
                    toCsv,
                })
            ) {
                return;
            }

            const records = await db
                .select()
                .from(pointages)
                .where(and(eq(pointages.userId, user.id), between(pointages.day, from, to)))
                .orderBy(asc(pointages.day))
                .all();

            const rows = buildExportRows(records, lang, iso);
            const headers = exportHeaders(lang);
            const fileName = `clockin-${from}_to_${to}`;

            if (format === "csv") {
                reply.header("Content-Type", "text/csv; charset=utf-8");
                reply.header("Content-Disposition", `attachment; filename="${fileName}.csv"`);
                return reply.send(Buffer.from(`\uFEFF${toCsv(rows, headers)}`));
            }

            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Pointages");
            const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

            reply.header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            reply.header("Content-Disposition", `attachment; filename="${fileName}.xlsx"`);
            return reply.send(buffer);
        },
    });

    fastify.route({
        method: "GET",
        url: "/pointages",
        schema: {
            querystring: z.object({
                from: daySchema.optional(),
                to: daySchema.optional(),
                offset: z.coerce.number().int().min(0).default(0),
                limit: z.coerce.number().int().min(1).max(1000).default(500),
            }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            const now = new Date();
            const defaults = historyDefaultRange();
            const from = request.query.from ?? defaults.from;
            const to = request.query.to ?? toISODate(now);
            const { offset, limit } = request.query;

            if (sendDemoHistoryPageIfNeeded(reply, user, from, to, offset, limit)) {
                return;
            }

            const where = and(eq(pointages.userId, user.id), between(pointages.day, from, to));

            const [records, totalResult] = await Promise.all([
                db.select().from(pointages).where(where).orderBy(asc(pointages.day)).limit(limit).offset(offset).all(),
                db.select({ value: count() }).from(pointages).where(where).get(),
            ]);

            return reply.send({
                rows: records,
                total: totalResult?.value ?? 0,
                offset,
                limit,
            });
        },
    });

    fastify.route({
        method: "POST",
        url: "/pointages",
        schema: {
            body: z.object({
                timestamp: timestampSchema,
            }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            if (sendDemoReadOnlyIfNeeded(request, reply, user)) {
                return;
            }
            const timestamp = parseTimestamp(request.body.timestamp);
            const day = toISODate(new Date(timestamp));

            let record = await db
                .select()
                .from(pointages)
                .where(and(eq(pointages.userId, user.id), eq(pointages.day, day)))
                .get();

            if (!record) {
                record = await db
                    .insert(pointages)
                    .values({ day, userId: user.id, firstEntry: timestamp })
                    .returning()
                    .get();
                return reply.status(201).send(record);
            }

            const nextSlot = slots.find((slot) => record[slot] === null);
            if (!nextSlot) {
                return reply.status(409).send({
                    error: translateRequest(request, "errors.allSlotsFilled"),
                });
            }

            const updated = await db
                .update(pointages)
                .set({ [nextSlot]: timestamp })
                .where(and(eq(pointages.userId, user.id), eq(pointages.id, record.id)))
                .returning()
                .get();

            return reply.status(200).send(updated);
        },
    });

    fastify.route({
        method: "PATCH",
        url: "/pointages/:id",
        schema: {
            params: z.object({ id: z.coerce.number().int().positive() }),
            body: z.object({
                slot: slotSchema,
                timestamp: timestampSchema.nullable(),
            }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            if (sendDemoReadOnlyIfNeeded(request, reply, user)) {
                return;
            }

            const existing = await db
                .select()
                .from(pointages)
                .where(and(eq(pointages.userId, user.id), eq(pointages.id, request.params.id)))
                .get();
            if (!existing)
                return reply
                    .status(404)
                    .send({ error: translateRequest(request, "errors.notFound") });

            const value =
                request.body.timestamp !== null
                    ? parseTimestamp(request.body.timestamp)
                    : null;

            const updated = await db
                .update(pointages)
                .set({ [request.body.slot]: value })
                .where(and(eq(pointages.userId, user.id), eq(pointages.id, request.params.id)))
                .returning()
                .get();

            return reply.send(updated);
        },
    });

    fastify.route({
        method: "DELETE",
        url: "/pointages/:id",
        schema: {
            params: z.object({ id: z.coerce.number().int().positive() }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            if (sendDemoReadOnlyIfNeeded(request, reply, user)) {
                return;
            }

            const existing = await db
                .select()
                .from(pointages)
                .where(and(eq(pointages.userId, user.id), eq(pointages.id, request.params.id)))
                .get();
            if (!existing)
                return reply
                    .status(404)
                    .send({ error: translateRequest(request, "errors.notFound") });

            await db
                .delete(pointages)
                .where(and(eq(pointages.userId, user.id), eq(pointages.id, request.params.id)))
                .run();

            return reply.status(204).send();
        },
    });
};

export default pointagesRoutes;
