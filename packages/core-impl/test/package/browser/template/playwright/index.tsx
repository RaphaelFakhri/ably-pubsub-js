import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { createClient } from '@ably/pubsub-device';
import { PubSubClientProvider, ChannelProvider } from '@ably/pubsub-device/react';

import { createSandboxAblyAPIKey } from '../src/sandbox';

beforeMount(async ({ App }) => {
  const key = await createSandboxAblyAPIKey();

  const client = createClient({
    key,
    endpoint: 'nonprod:sandbox',
  });

  return (
    <PubSubClientProvider client={client}>
      <ChannelProvider channelName="channel">
        <App />
      </ChannelProvider>
    </PubSubClientProvider>
  );
});
