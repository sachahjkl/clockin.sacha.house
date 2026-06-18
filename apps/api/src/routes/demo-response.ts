import type { FastifyReply, FastifyRequest } from "fastify";
import { isDemoUser } from "../demo.js";
import type { User } from "../db/schema.js";
import { translateRequest } from "../translation/index.js";

export function sendDemoReadOnlyIfNeeded(
    request: FastifyRequest,
    reply: FastifyReply,
    user: User,
): boolean {
    if (!isDemoUser(user)) {
        return false;
    }

    void reply.status(403).send({
        error: translateRequest(request, "errors.demoReadOnly"),
    });
    return true;
}
