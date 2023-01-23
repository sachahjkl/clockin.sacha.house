import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import { AppRouter } from '../../../../server/src/routers';
import SuperJSON from 'superjson';

export const client = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
});
