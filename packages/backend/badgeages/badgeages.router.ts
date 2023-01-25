import { authedProcedure, createTRPCRouter, publicProcedure } from '../trpc';

import { badgeagesSchema } from './badgeages.model';

export const badgeageRouter = createTRPCRouter({
	greet: publicProcedure.query(() => {
		return 'Salut !';
	})
	// userLogin: publicProcedure.que
});
