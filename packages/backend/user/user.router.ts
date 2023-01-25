import { createTRPCRouter, loggedOutProcedure, publicProcedure } from '../trpc';
import { db, isUsernameTaken } from '../utils/db';

import { TRPCError } from '@trpc/server';
import argon2 from 'argon2';
import { createSession } from '../utils/auth';
import { registerUserSchema } from './user.model';
import { z } from 'zod';

export const userRouter = createTRPCRouter({
	greet: publicProcedure.query(() => {
		return 'Salut !';
	}),
	checkUsername: publicProcedure.input(z.string()).query(async (opts) => {
		return isUsernameTaken(opts.input);
	}),
	registerUser: loggedOutProcedure
		.input(registerUserSchema)
		.meta({ loggedOut: true })
		.mutation(async (opts) => {
			const { ctx, input } = opts;

			const alreadyExists = await isUsernameTaken(input.username);
			if (alreadyExists) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: `Nom d'utilsateur ${input.username} déjà pris`
				});
			}
			const user = await db.user.create({
				data: {
					username: input.username,
					passwordHash: await argon2.hash(input.password)
				}
			});
			const session = createSession(user);
			ctx.res.header('Authorization', `Bearer ${session}`);
		})

	// userLogin: publicProcedure.que
});
