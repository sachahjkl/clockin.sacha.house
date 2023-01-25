import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireUser } from "../auth.js";

const meRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get("/me", async (request, reply) => {
        const user = requireUser(request);
        return reply.send({ userId: user.userId, createdAt: user.createdAt });
    });
};

export default meRoutes;
