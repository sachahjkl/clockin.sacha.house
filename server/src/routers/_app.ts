import { router } from '../trpc';
import { userRouter } from './user';

export const appRouter = router({
	user: userRouter // put procedures under "user" namespace
	// post: postRouter // put procedures under "post" namespace
});

export type AppRouter = typeof appRouter;
