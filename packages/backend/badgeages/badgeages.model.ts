import { z } from 'zod';

export const badgeagesSchema = z
	.array(z.date().nullable(), {
		description: 'Dates de badgeage'
	})
	.length(4);
