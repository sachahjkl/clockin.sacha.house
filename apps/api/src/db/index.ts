import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

function toLibsqlUrl(url: string) {
    if (/^(file:|https?:|libsql:)/.test(url)) return url;
    return `file:${url}`;
}

const databaseUrl = toLibsqlUrl(process.env.DATABASE_URL ?? "./data/clockin.sqlite");
const filePath = databaseUrl.startsWith("file:") ? databaseUrl.slice(5) : databaseUrl;
fs.mkdirSync(path.dirname(filePath), { recursive: true });

const client = createClient({ url: databaseUrl });

export const db = drizzle(client, { schema });