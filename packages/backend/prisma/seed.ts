import { PrismaClient } from '@prisma/client';
import argon2id from 'argon2';
import dotenv from 'dotenv-flow';

const prisma = new PrismaClient();

async function main() {
	dotenv.config();

	const BASE_FIXTURES_PASSWORD = process.env.SEED_PASSWORD || 'password';

	const fixtures = await prisma.user.upsert({
		where: { username: 'sacha' },
		update: {},
		create: {
			username: 'sacha',
			passwordHash: await argon2id.hash(BASE_FIXTURES_PASSWORD)
		}
	});

	console.log({ fixtures });
}
main()
	.catch((e) => {
		console.error(e);
		process.exit();
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
