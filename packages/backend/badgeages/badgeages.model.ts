import { z } from 'zod';

export const badgeageSchema = z.object({
	date: z.date()
});
