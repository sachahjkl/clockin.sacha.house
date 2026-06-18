import { count, eq } from "drizzle-orm";
import { DEMO_USER_ID } from "./demo.js";
import { db } from "./db/index.js";
import { badgeages, users, type User } from "./db/schema.js";

export async function ensureDevFixture(): Promise<void> {
    const user = await ensureDemoUser();
    const existing = await db
        .select({ count: count() })
        .from(badgeages)
        .where(eq(badgeages.userId, user.id))
        .get();

    if ((existing?.count ?? 0) === 0) {
        return;
    }

    await db.delete(badgeages).where(eq(badgeages.userId, user.id)).run();
}

async function ensureDemoUser(): Promise<User> {
    const existing = await db.select().from(users).where(eq(users.userId, DEMO_USER_ID)).get();
    if (existing) {
        return existing;
    }

    return db
        .insert(users)
        .values({
            userId: DEMO_USER_ID,
            name: "Demo",
            email: "demo@example.com",
        })
        .returning()
        .get();
}
