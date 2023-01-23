import { authedProcedure, createRouterRouter, publicProcedure } from '../trpc';

import { z } from 'zod';

export const userRouter = createRouterRouter({
	userCreate: authedProcedure
		.meta({ hasAuth: false })
		.input(
			z.object({
				username: z.string().max(120).min(4)
			})
		)
		.mutation(({ ctx, input }) => {
			input;
			ctx;
			return {};
		})
	// userLogin: publicProcedure.que
});
