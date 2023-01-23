import { Context, createContext } from './context';
import { TRPCError, initTRPC } from '@trpc/server';

interface Meta {
	hasAuth: boolean;
}

export const t = initTRPC.context<Context>().meta<Meta>().create();

const isAuthed = t.middleware(async ({ meta, next, ctx }) => {
	// only check authorization if enabled
	if (meta?.hasAuth && !ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next();
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(isAuthed);
export { createContext } from './context';
