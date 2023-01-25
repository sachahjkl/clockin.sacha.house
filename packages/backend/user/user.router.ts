import * as argon2 from 'argon2';

import { createTRPCRouter, loggedOutProcedure, publicProcedure } from '../trpc';
import { db, isUsernameTaken } from '../utils/db';
import { loginUserSchema, registerUserSchema } from './user.model';

import { TRPCError } from '@trpc/server';
import { createSession } from '../utils/auth';
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
			const { input } = opts;

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
				},
				select: {
					id: true,
					username: true
				}
			});
			const session = await createSession(user);
			return { user, session };
		}),

	loginUser: loggedOutProcedure
		.input(loginUserSchema)
		.meta({ loggedOut: true })
		.mutation(async (ctx) => {
			const passwordHash = await argon2.hash(ctx.input.password);
			const user = await db.user.findFirst({
				where: {
					passwordHash: {
						equals: passwordHash
					},
					username: {
						equals: ctx.input.username
					}
				}
			});
			if (!user) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Identification échouée.'
				});
			}
			const session = await createSession(user);
			return { session, user };
		})
});
