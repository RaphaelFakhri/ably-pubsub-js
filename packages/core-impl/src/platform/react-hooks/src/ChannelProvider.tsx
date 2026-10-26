import React, { useLayoutEffect, useMemo } from 'react';
import * as Ably from '@ably/pubsub-core/api';
import { type PubSubContextValue, PubSubContext } from './PubSubContext.js';
import { channelOptionsForReactHooks } from './PubSubReactHooks.js';

interface ChannelProviderProps {
  ablyId?: string;
  channelName: string;
  options?: Ably.ChannelOptions;
  deriveOptions?: Ably.DeriveOptions;
  children?: React.ReactNode | React.ReactNode[] | null;
}

export const ChannelProvider = ({
  ablyId = 'default',
  channelName,
  options,
  deriveOptions,
  children,
}: ChannelProviderProps) => {
  const context = React.useContext(PubSubContext);
  const { client, _channelNameToChannelContext } = context[ablyId];

  if (_channelNameToChannelContext[channelName]) {
    throw new Error('You can not use more than one `ChannelProvider` with the same channel name');
  }

  const derived = Boolean(deriveOptions);
  const channel = derived ? client.channels.getDerived(channelName, deriveOptions) : client.channels.get(channelName);

  const value: PubSubContextValue = useMemo(() => {
    return {
      ...context,
      [ablyId]: {
        client,
        _channelNameToChannelContext: {
          ..._channelNameToChannelContext,
          [channelName]: {
            channel,
            derived,
          },
        },
        _nearestChannelName: channelName,
      },
    };
  }, [derived, client, channel, channelName, _channelNameToChannelContext, ablyId, context]);

  useLayoutEffect(() => {
    channel.setOptions(channelOptionsForReactHooks(options));
  }, [channel, options]);

  return <PubSubContext.Provider value={value}>{children}</PubSubContext.Provider>;
};
