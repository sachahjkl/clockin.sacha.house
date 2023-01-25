import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { inferAsyncReturnType } from '@trpc/server';
import { userFromAuthorization } from '../utils/auth';

export const createContext = async (opts: CreateFastifyContextOptions) => {
	const { authorization } = opts.req.headers;

	const user = await userFromAuthorization(authorization || '');
	return {
		user,
		req: opts.req,
		res: opts.res
	};
}; // no context
export type Context = inferAsyncReturnType<typeof createContext>;
