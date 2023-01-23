import { z } from 'zod';

const User = z.object({
	username: z.string().min(5).max(120)
});

export type User = z.infer<typeof User>;
