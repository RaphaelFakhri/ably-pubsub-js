import type { PubSubClient, RealtimeChannel } from '@ably/pubsub-core/device';
import React from 'react';

// We need to make sure we never create more than one Ably React context.
// This might happen when exporting a context directly from a module -
// there's a risk of creating multiple instances of the same context
// if there are misconfigurations in module bundler or package manager on the consumer side of Ably Context.
// This can lead to problems like having an Ably Channel instance added
// in one context, and then attempting to retrieve it from another different context.
// This is why a single Ably context is created and stored in the global state.
const contextKey = Symbol.for('__PUBSUB_CONTEXT__');

const globalObjectForContext: { [contextKey]?: React.Context<PubSubContextValue> } =
  typeof globalThis !== 'undefined' ? (globalThis as any) : {};

// Ably context contains an object which stores all provider options indexed by provider id,
// which is used to get options set by specific `PubSubClientProvider` after calling `React.useContext`.
export type PubSubContextValue = Record<string, PubSubContextProviderProps>;

export interface PubSubContextProviderProps {
  client: PubSubClient;
  _channelNameToChannelContext: Record<string, ChannelContextProps>;
  // The channel named by the closest enclosing `ChannelProvider`. Channel hooks
  // called without an explicit channel name resolve to this, so the name does
  // not have to be repeated when there is a surrounding provider.
  _nearestChannelName?: string;
}

export interface ChannelContextProps {
  channel: RealtimeChannel;
  derived?: boolean;
}

function getContext(): React.Context<PubSubContextValue> {
  let context = globalObjectForContext[contextKey];
  if (!context) {
    context = globalObjectForContext[contextKey] = React.createContext<PubSubContextValue>({});
  }

  return context;
}

export const PubSubContext = getContext();
