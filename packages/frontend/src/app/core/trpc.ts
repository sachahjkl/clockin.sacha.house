import { type AppRouter } from 'backend';

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import SuperJSON from 'superjson';
import { environment } from 'src/environments/environment';

export const client = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: environment.TRPC_URL,
    }),
  ],
});
