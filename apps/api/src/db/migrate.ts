import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });