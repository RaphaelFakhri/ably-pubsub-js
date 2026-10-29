import React from 'react';
import { PubSubContext } from '../PubSubContext.js';
import type { PubSubClient } from '@ably/pubsub-core/device';

export function usePubSubClient(contextId = 'default'): PubSubClient {
  const client = React.useContext(PubSubContext)[contextId]?.client;

  if (!client) {
    throw new Error(
      'Could not find ably client in context. ' +
        'Make sure your ably hooks are called inside an <PubSubClientProvider>',
    );
  }

  return client;
}
