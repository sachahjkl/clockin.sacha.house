import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { badgeageRouter } from './badgeages/badgeages.router';
import { createTRPCRouter } from './trpc';
import { userRouter } from './user/user.router';

// Here we merge all the sub-routers defined in routers/**
// into a single app router.

export const appRouter = createTRPCRouter({
	user: userRouter, // put procedures under "user" namespace
	badgeages: badgeageRouter
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
