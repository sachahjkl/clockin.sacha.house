import { TRPCError, initTRPC } from '@trpc/server';

import { Context } from './context';
import superjson from 'superjson';

interface Meta {
	hasAuth?: boolean;
	loggedOut?: boolean;
}

export const t = initTRPC.context<Context>().meta<Meta>().create({
	transformer: superjson
});

const isAuthed = t.middleware(async ({ meta, next, ctx }) => {
	// only check authorization if enabled
	if (meta?.hasAuth && ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next();
});

const isLoggedOut = t.middleware(async ({ meta, next, ctx }) => {
	// needs to be logged out to do operation
	if (meta?.loggedOut && ctx.user !== null) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next();
});

export const createTRPCRouter = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(isAuthed);
export const loggedOutProcedure = t.procedure.use(isLoggedOut);
export { createContext } from './context';
