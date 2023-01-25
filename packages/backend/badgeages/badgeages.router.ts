import { authedProcedure, createTRPCRouter, publicProcedure } from '../trpc';

import { badgeageSchema } from './badgeages.model';

export const badgeageRouter = createTRPCRouter({
	greet: publicProcedure.query(() => {
		return 'Salut !';
	}),
	userCreate: authedProcedure
		.meta({ hasAuth: false })
		.input(badgeageSchema)
		.mutation(({ ctx, input }) => {
			input;
			ctx;
			return {};
		})
	// userLogin: publicProcedure.que
});
