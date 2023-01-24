import { authedProcedure, createTRPCRouter, publicProcedure } from '../trpc';

import { userSchema } from './user.model';

export const userRouter = createTRPCRouter({
	greet: publicProcedure.query(() => {
		return 'Salut !';
	}),
	userCreate: authedProcedure
		.meta({ hasAuth: false })
		.input(userSchema)
		.mutation(({ ctx, input }) => {
			input;
			ctx;
			return {};
		})
	// userLogin: publicProcedure.que
});
