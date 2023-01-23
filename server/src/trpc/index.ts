import { TRPCError, initTRPC } from '@trpc/server';

import { Context } from './context';
import superjson from 'superjson';

interface Meta {
	hasAuth: boolean;
}

export const t = initTRPC.context<Context>().meta<Meta>().create({
	transformer: superjson
});

const isAuthed = t.middleware(async ({ meta, next, ctx }) => {
	// only check authorization if enabled
	if (meta?.hasAuth && !ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next();
});

export const createRouterRouter = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(isAuthed);
export { createContext } from './context';
