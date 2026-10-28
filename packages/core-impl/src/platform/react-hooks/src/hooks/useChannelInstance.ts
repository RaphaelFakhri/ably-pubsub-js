import React from 'react';
import { PubSubContext, ChannelContextProps } from '../PubSubContext.js';

export type ResolvedChannelContextProps = ChannelContextProps & { channelName: string };

export function useChannelInstance(contextId = 'default', channelName?: string): ResolvedChannelContextProps {
  const pubSubContext = React.useContext(PubSubContext)[contextId];

  if (!pubSubContext) {
    throw new Error(
      'Could not find ably client in context. ' +
        'Make sure your ably hooks are called inside an <PubSubClientProvider>',
    );
  }

  const { _channelNameToChannelContext, _nearestChannelName } = pubSubContext;

  // When no channel name is provided, resolve to the channel named by the
  // closest enclosing `ChannelProvider`.
  const resolvedChannelName = channelName ?? _nearestChannelName;

  if (resolvedChannelName === undefined) {
    throw new Error(
      'No channel name was provided and there is no parent ChannelProvider to infer one from. Make sure your channel based hooks (usePresence, useChannel, useChannelStateListener) are called inside a <ChannelProvider> component, or pass a channel name explicitly',
    );
  }

  const channelContext = _channelNameToChannelContext[resolvedChannelName];

  if (!channelContext) {
    throw new Error(
      `Could not find a parent ChannelProvider in the component tree for channelName="${resolvedChannelName}". Make sure your channel based hooks (usePresence, useChannel, useChannelStateListener) are called inside a <ChannelProvider> component`,
    );
  }

  return { ...channelContext, channelName: resolvedChannelName };
}
