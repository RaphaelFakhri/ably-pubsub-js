import type { PubSubClient } from '@ably/pubsub-core/device';
import React, { useMemo } from 'react';
import { PubSubContext, PubSubContextValue } from './PubSubContext.js';

interface PubSubClientProviderProps {
  children?: React.ReactNode | React.ReactNode[] | null;
  client?: PubSubClient;
  contextId?: string;
}

export const PubSubClientProvider = ({ client, children, contextId = 'default' }: PubSubClientProviderProps) => {
  if (!client) {
    throw new Error('PubSubClientProvider: the `client` prop is required');
  }

  const context = React.useContext(PubSubContext);

  const value: PubSubContextValue = useMemo(() => {
    return { ...context, [contextId]: { client, _channelNameToChannelContext: {} } };
  }, [context, client, contextId]);

  return <PubSubContext.Provider value={value}>{children}</PubSubContext.Provider>;
};
