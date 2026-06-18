import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import { db } from "./db/index.js";
import { users, type User } from "./db/schema.js";
import { translateRequest } from "./translation/index.js";

declare module "fastify" {
    interface FastifyRequest {
        user: User | null;
    }
}

const BEARER_PREFIX = "Bearer ";

export async function getUser(authorization?: string): Promise<User | null> {
    if (!authorization || !authorization.startsWith(BEARER_PREFIX)) return null;

    const userId = authorization.slice(BEARER_PREFIX.length).trim();
    if (!userId) return null;

    const user = await db.select().from(users).where(eq(users.userId, userId)).get();
    return user ?? null;
}

export async function populateUser(request: FastifyRequest): Promise<void> {
    request.user = await getUser(request.headers.authorization);
}

export function requireUser(request: FastifyRequest): User {
    if (!request.user) {
        const err = new Error(translateRequest(request, "errors.unauthorized")) as Error & {
            statusCode?: number;
        };
        err.statusCode = 401;
        throw err;
    }

    return request.user;
}