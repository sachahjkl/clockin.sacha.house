import type { FastifyReply } from "fastify";
import { demoBadgeagesInRange, isDemoUser } from "../demo.js";
import type { User } from "../db/schema.js";

export function sendDemoClockinPageDataIfNeeded(
    reply: FastifyReply,
    user: User,
    from: string,
    to: string,
): boolean {
    if (!isDemoUser(user)) {
        return false;
    }

    void reply.send({
        profile: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        },
        badgeages: demoBadgeagesInRange(user, from, to),
    });
    return true;
}
