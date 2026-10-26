import * as Ably from '@ably/pubsub-core/api';
import React, { useMemo } from 'react';
import { PubSubContext, PubSubContextValue } from './PubSubContext.js';

interface PubSubClientProviderProps {
  children?: React.ReactNode | React.ReactNode[] | null;
  client?: Ably.PubSubRealtimeClient;
  ablyId?: string;
}

export const PubSubClientProvider = ({ client, children, ablyId = 'default' }: PubSubClientProviderProps) => {
  if (!client) {
    throw new Error('PubSubClientProvider: the `client` prop is required');
  }

  const context = React.useContext(PubSubContext);

  const value: PubSubContextValue = useMemo(() => {
    return { ...context, [ablyId]: { client, _channelNameToChannelContext: {} } };
  }, [context, client, ablyId]);

  return <PubSubContext.Provider value={value}>{children}</PubSubContext.Provider>;
};
