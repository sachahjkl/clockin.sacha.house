import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { inferAsyncReturnType } from '@trpc/server';

export const createContext = (_opts: CreateFastifyContextOptions) => {
	// const user: User | null = null;
	return {
		info: 'salut'
	};
}; // no context
export type Context = inferAsyncReturnType<typeof createContext>;
