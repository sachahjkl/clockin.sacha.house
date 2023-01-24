import { z } from 'zod';

export const userSchema = z.object({
	username: z.string().max(120).min(4)
});
