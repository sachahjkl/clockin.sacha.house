import { and, asc, between, count, eq, gte, lt } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as XLSX from "xlsx";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { db } from "../db/index.js";
import { pointages, type Pointage, type Slot } from "../db/schema.js";
import { demoPointagesInRange, historyDefaultRange, isDemoUser } from "../demo.js";
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
const chartPeriodSchema = z.enum(["week", "month", "year"]);
const exportIsoSchema = z.preprocess(
    (value) => (value === undefined ? "false" : value),
    z.enum(["true", "false"]).transform((value) => value === "true"),
);

interface StatsPeriod {
    from: string;
    to: string;
}

type ChartPeriod = z.infer<typeof chartPeriodSchema>;

interface ChartRange extends StatsPeriod {
    period: ChartPeriod;
    previousAnchor: string;
    nextAnchor: string | null;
}

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
                        buildExportRows(
                            demoExportRows(demoUser, exportFrom, exportTo),
                            exportLang,
                            iso,
                        ),
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
        url: "/pointages/stats",
        schema: {
            querystring: z.object({
                period: chartPeriodSchema.default("year"),
                anchor: daySchema.optional(),
            }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            const now = new Date();
            const periods = statsPeriods(now);
            const chart = chartRange(request.query.period, request.query.anchor, now);

            const loadPeriod = (period: StatsPeriod) =>
                isDemoUser(user)
                    ? Promise.resolve(demoPointagesInRange(user, period.from, period.to))
                    : db
                          .select()
                          .from(pointages)
                          .where(
                              and(
                                  eq(pointages.userId, user.id),
                                  between(pointages.day, period.from, period.to),
                              ),
                          )
                          .all();

            const recordsPromise = loadPeriod(periods.year);
            const chartRecordsPromise =
                chart.from === periods.year.from && chart.to === periods.year.to
                    ? recordsPromise
                    : loadPeriod(chart);
            const [records, chartRecords] = await Promise.all([
                recordsPromise,
                chartRecordsPromise,
            ]);

            return reply.send({
                week: summarizePeriod(records, periods.week),
                month: summarizePeriod(records, periods.month),
                year: summarizePeriod(records, periods.year),
                chart: {
                    ...chart,
                    points: summarizeChart(chartRecords, chart),
                },
            });
        },
    });

    fastify.route({
        method: "GET",
        url: "/pointages/index",
        schema: {
            querystring: z.object({
                day: daySchema,
            }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            const { day } = request.query;

            if (isDemoUser(user)) {
                const defaults = historyDefaultRange();
                const firstDay = defaults.from;
                const lastDay = defaults.to;
                const clampedDay = day < firstDay ? firstDay : day > lastDay ? lastDay : day;

                return reply.send({
                    index: dayDiff(firstDay, clampedDay),
                    day: clampedDay,
                    exact: day >= firstDay && day <= lastDay,
                });
            }

            const [nextRecord, beforeCount, totalResult] = await Promise.all([
                db
                    .select({ day: pointages.day })
                    .from(pointages)
                    .where(and(eq(pointages.userId, user.id), gte(pointages.day, day)))
                    .orderBy(asc(pointages.day))
                    .limit(1)
                    .get(),
                db
                    .select({ value: count() })
                    .from(pointages)
                    .where(and(eq(pointages.userId, user.id), lt(pointages.day, day)))
                    .get(),
                db
                    .select({ value: count() })
                    .from(pointages)
                    .where(eq(pointages.userId, user.id))
                    .get(),
            ]);

            const total = totalResult?.value ?? 0;
            const index = nextRecord
                ? Math.max(0, (beforeCount?.value ?? 0))
                : Math.max(0, total - 1);

            return reply.send({
                index,
                day: nextRecord?.day ?? null,
                exact: nextRecord?.day === day,
            });
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
                db
                    .select()
                    .from(pointages)
                    .where(where)
                    .orderBy(asc(pointages.day))
                    .limit(limit)
                    .offset(offset)
                    .all(),
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
        url: "/pointages/by-day/:day",
        schema: {
            params: z.object({ day: daySchema }),
            body: z.object({
                slot: slotSchema,
                timestamp: timestampSchema,
            }),
        },
        handler: async (request, reply) => {
            const user = requireUser(request);
            if (sendDemoReadOnlyIfNeeded(request, reply, user)) {
                return;
            }

            const value = parseTimestamp(request.body.timestamp);
            const day = request.params.day;

            const existing = await db
                .select()
                .from(pointages)
                .where(and(eq(pointages.userId, user.id), eq(pointages.day, day)))
                .get();

            if (!existing) {
                const created = await db
                    .insert(pointages)
                    .values({
                        day,
                        userId: user.id,
                        [request.body.slot]: value,
                    })
                    .returning()
                    .get();

                return reply.status(201).send(created);
            }

            const updated = await db
                .update(pointages)
                .set({ [request.body.slot]: value })
                .where(and(eq(pointages.userId, user.id), eq(pointages.id, existing.id)))
                .returning()
                .get();

            return reply.send(updated);
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
                request.body.timestamp !== null ? parseTimestamp(request.body.timestamp) : null;

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

function dayDiff(from: string, to: string): number {
    const start = new Date(`${from}T00:00:00.000Z`).getTime();
    const end = new Date(`${to}T00:00:00.000Z`).getTime();
    return Math.max(0, Math.floor((end - start) / 86400000));
}

function summarizePeriod(records: Array<Pick<Pointage, "day" | Slot>>, period: StatsPeriod) {
    let totalSeconds = 0;
    let workedDays = 0;

    for (const record of records) {
        if (record.day < period.from || record.day > period.to) {
            continue;
        }

        const seconds = computeTotalSeconds(record as Pointage);
        totalSeconds += seconds;
        if (seconds > 0) {
            workedDays += 1;
        }
    }

    return {
        totalSeconds,
        averageWorkedDaySeconds: workedDays > 0 ? Math.floor(totalSeconds / workedDays) : 0,
        workedDays,
    };
}

function chartRange(period: ChartPeriod, anchor: string | undefined, now: Date): ChartRange {
    const currentStart = startOfChartPeriod(period, now);
    let start = startOfChartPeriod(period, anchor ? fromISODate(anchor) : now);
    if (start > currentStart) {
        start = currentStart;
    }

    const fullEnd = endOfChartPeriod(period, start);
    const today = toISODate(now);
    const from = toISODate(start);
    const to = toISODate(fullEnd) > today ? today : toISODate(fullEnd);
    const previous = shiftChartPeriod(period, start, -1);
    const next = shiftChartPeriod(period, start, 1);

    return {
        period,
        from,
        to,
        previousAnchor: toISODate(previous),
        nextAnchor: next <= currentStart ? toISODate(next) : null,
    };
}

function summarizeChart(records: Array<Pick<Pointage, "day" | Slot>>, range: ChartRange) {
    const totals = new Map<string, number>();
    for (const record of records) {
        const key = range.period === "year" ? record.day.slice(0, 7) : record.day;
        totals.set(key, (totals.get(key) ?? 0) + computeTotalSeconds(record as Pointage));
    }

    const points: Array<{ key: string; totalSeconds: number }> = [];
    const cursor = fromISODate(range.from);
    const end = fromISODate(range.to);

    while (cursor <= end) {
        const key = range.period === "year" ? toISODate(cursor).slice(0, 7) : toISODate(cursor);
        points.push({ key, totalSeconds: totals.get(key) ?? 0 });
        if (range.period === "year") {
            cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
        } else {
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
    }

    return points;
}

function startOfChartPeriod(period: ChartPeriod, date: Date): Date {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    if (period === "week") {
        const day = start.getUTCDay();
        start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1));
    } else if (period === "month") {
        start.setUTCDate(1);
    } else {
        start.setUTCMonth(0, 1);
    }

    return start;
}

function endOfChartPeriod(period: ChartPeriod, start: Date): Date {
    const end = shiftChartPeriod(period, start, 1);
    end.setUTCDate(end.getUTCDate() - 1);
    return end;
}

function shiftChartPeriod(period: ChartPeriod, date: Date, amount: number): Date {
    const shifted = new Date(date);
    if (period === "week") {
        shifted.setUTCDate(shifted.getUTCDate() + amount * 7);
    } else if (period === "month") {
        shifted.setUTCMonth(shifted.getUTCMonth() + amount, 1);
    } else {
        shifted.setUTCFullYear(shifted.getUTCFullYear() + amount, 0, 1);
    }
    return shifted;
}

function fromISODate(day: string): Date {
    return new Date(`${day}T00:00:00.000Z`);
}

function statsPeriods(now: Date): Record<"week" | "month" | "year", StatsPeriod> {
    const today = toISODate(now);

    const weekStart = startOfWorkWeek(now);
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const yearStart = new Date(now);
    yearStart.setMonth(0, 1);
    yearStart.setHours(0, 0, 0, 0);

    return {
        week: { from: toISODate(weekStart), to: today },
        month: { from: toISODate(monthStart), to: today },
        year: { from: toISODate(yearStart), to: today },
    };
}

function startOfWorkWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
}
