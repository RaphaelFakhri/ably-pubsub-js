import React from 'react';
import { PubSubContext } from '../PubSubContext.js';
import * as API from '@ably/pubsub-core/api';

export function usePubSubClient(contextId = 'default'): API.PubSubRealtimeClient {
  const client = React.useContext(PubSubContext)[contextId]?.client;

  if (!client) {
    throw new Error(
      'Could not find ably client in context. ' +
        'Make sure your ably hooks are called inside an <PubSubClientProvider>',
    );
  }

  return client;
}
