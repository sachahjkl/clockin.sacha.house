import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().unique(),
    name: text("name"),
    email: text("email"),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
});

export const badgeages = sqliteTable("badgeages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    day: text("day").notNull(),
    firstEntry: text("first_entry"),
    firstExit: text("first_exit"),
    secondEntry: text("second_entry"),
    secondExit: text("second_exit"),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
});

export type User = typeof users.$inferSelect;
export type Badgeage = typeof badgeages.$inferSelect;
export type BadgeageInsert = typeof badgeages.$inferInsert;
export type Slot = "firstEntry" | "firstExit" | "secondEntry" | "secondExit";