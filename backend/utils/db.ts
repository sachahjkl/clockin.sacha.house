import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
	log: ['error', 'warn'],
	errorFormat: 'minimal'
});

export const db = prisma;

export default prisma;

export async function isUsernameTaken(username: string) {
	return await db.user
		.findFirst({
			where: {
				username: {
					equals: username
				}
			}
		})
		.then(Boolean);
}
