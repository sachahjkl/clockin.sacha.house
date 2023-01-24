import { authedProcedure, createTRPCRouter, publicProcedure } from '../trpc';

import { z } from 'zod';

export const userRouter = createTRPCRouter({
	greet: publicProcedure.query(() => {
		return 'Salut !';
	}),
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
