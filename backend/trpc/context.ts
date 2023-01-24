import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { User } from '../app/db';
import { inferAsyncReturnType } from '@trpc/server';

export const createContext = (_opts: CreateFastifyContextOptions) => {
	const user: User | null = null;

	return {
		user
	};
}; // no context
export type Context = inferAsyncReturnType<typeof createContext>;
