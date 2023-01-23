import * as trpcExpress from '@trpc/server/adapters/express';

import { User } from '../db';
import { inferAsyncReturnType } from '@trpc/server';

export const createContext = (opts: trpcExpress.CreateExpressContextOptions) => {
	let user: User | null = null;
	if (opts.req.cookies['token'] === 'LOGGEDIN') {
		user = { username: '' };
	}
	return {
		user
	};
}; // no context
export type Context = inferAsyncReturnType<typeof createContext>;
