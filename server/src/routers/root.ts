import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { createRouterRouter } from '../trpc';
import { userRouter } from './user';

// Here we merge all the sub-routers defined in routers/**
// into a single app router.

export const appRouter = createRouterRouter({
	user: userRouter // put procedures under "user" namespace
	// post: postRouter // put procedures under "post" namespace
});

export type AppRouter = typeof appRouter;

/**
 * Inference helper for inputs
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;
/**
 * Inference helper for outputs
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;
