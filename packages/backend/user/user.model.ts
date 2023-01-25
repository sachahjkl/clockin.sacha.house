import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const loginUserSchema = z.object({
	username: z
		.string({
			invalid_type_error: "Le nom d'utilisateur doit être une chaîne de caractère.",
			required_error: "Le nom d'utilisateur est obligatoire."
		})
		.trim()
		.max(120, { message: "La longueur maximale du nom d'utilisateur est de 120 caractères." })
		.min(4, { message: "La longueur minimale du nom d'utilisateur est de 4 caractères." }),
	password: z
		.string({
			invalid_type_error: 'Le mote de passe doit être une chaîne de caractère.',
			required_error: 'Le mot de passe est obligatoire.'
		})
		.trim()
		.min(6, {
			message: "Le mot de passe doit être d'une longueur minimale de 6 caractères"
		})
});

export const registerUserSchema = loginUserSchema
	.extend({
		confirmPassword: loginUserSchema.shape.password
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				code: 'custom',
				message: 'The passwords did not match'
			});
		}
	});

export type BaseUser = Prisma.UserGetPayload<{
	select: {
		id: true;
		username: true;
		passwordHash: true;
	};
}>;

export type EncryptedUser = Omit<BaseUser, 'passwordHash'>;
