import type { FastifyReply } from "fastify";
import * as XLSX from "xlsx";
import {
    demoBadgeagesInRange,
    demoHistoryPage,
    historyDefaultRange,
    isDemoUser,
} from "../demo.js";
import type { User } from "../db/schema.js";

export interface DemoExportContext {
    format: "csv" | "xlsx";
    from: string;
    to: string;
    lang: "fr" | "en";
    buildRows: (user: User, from: string, to: string, lang: "fr" | "en") => Array<Record<string, string>>;
    headers: (lang: "fr" | "en") => string[];
    toCsv: (rows: Array<Record<string, string>>, headers: string[]) => string;
}

export function sendDemoHistoryPageIfNeeded(
    reply: FastifyReply,
    user: User,
    from: string | undefined,
    to: string | undefined,
    offset: number,
    limit: number,
): boolean {
    if (!isDemoUser(user)) {
        return false;
    }

    const defaults = historyDefaultRange();
    void reply.send(demoHistoryPage(user, from ?? defaults.from, to ?? defaults.to, offset, limit));
    return true;
}

export function sendDemoBadgeagesExportIfNeeded(
    reply: FastifyReply,
    user: User,
    context: DemoExportContext,
): boolean {
    if (!isDemoUser(user)) {
        return false;
    }

    const rows = context.buildRows(user, context.from, context.to, context.lang);
    const headers = context.headers(context.lang);
    const fileName = `clockin-${context.from}_to_${context.to}`;

    if (context.format === "csv") {
        void reply.header("Content-Type", "text/csv; charset=utf-8");
        void reply.header("Content-Disposition", `attachment; filename="${fileName}.csv"`);
        void reply.send(Buffer.from(`\uFEFF${context.toCsv(rows, headers)}`));
        return true;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Badgeages");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    void reply.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    void reply.header("Content-Disposition", `attachment; filename="${fileName}.xlsx"`);
    void reply.send(buffer);
    return true;
}

export function demoExportRows(user: User, from: string, to: string): ReturnType<typeof demoBadgeagesInRange> {
    return demoBadgeagesInRange(user, from, to);
}
