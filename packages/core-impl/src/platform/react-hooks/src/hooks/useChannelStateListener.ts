import * as Ably from '@ably/pubsub-core/api';
import { ChannelNameAndContextId } from '../PubSubReactHooks.js';
import { useEventListener } from './useEventListener.js';
import { useChannelInstance } from './useChannelInstance.js';

type ChannelStateListener = (stateChange: Ably.ChannelStateChange) => any;

// The channel name can be omitted to use the channel from the nearest ChannelProvider.
export function useChannelStateListener(listener?: ChannelStateListener);

export function useChannelStateListener(channelName: string, listener?: ChannelStateListener);

export function useChannelStateListener(options: ChannelNameAndContextId, listener?: ChannelStateListener);

export function useChannelStateListener(
  options: ChannelNameAndContextId | string,
  state?: Ably.ChannelState | Ably.ChannelState[],
  listener?: ChannelStateListener,
);

export function useChannelStateListener(
  channelNameOrNameAndContextIdOrListener?: ChannelNameAndContextId | string | ChannelStateListener,
  stateOrListener?: Ably.ChannelState | Ably.ChannelState[] | ChannelStateListener,
  listener?: (stateChange: Ably.ChannelStateChange) => any,
) {
  // The first argument is the listener when the channel name is inferred from a
  // surrounding ChannelProvider, e.g. useChannelStateListener(listener).
  const inferChannelFromNearestProvider = typeof channelNameOrNameAndContextIdOrListener === 'function';
  const channelNameOrNameAndContextId = inferChannelFromNearestProvider
    ? undefined
    : (channelNameOrNameAndContextIdOrListener as ChannelNameAndContextId | string | undefined);
  const stateOrListenerArg = inferChannelFromNearestProvider
    ? (channelNameOrNameAndContextIdOrListener as ChannelStateListener)
    : stateOrListener;

  const channelHookOptions =
    typeof channelNameOrNameAndContextId === 'object'
      ? channelNameOrNameAndContextId
      : channelNameOrNameAndContextId === undefined
        ? {}
        : { channelName: channelNameOrNameAndContextId };

  const { contextId, channelName } = channelHookOptions;

  const { channel } = useChannelInstance(contextId, channelName);

  const _listener =
    typeof listener === 'function'
      ? listener
      : typeof stateOrListenerArg === 'function'
        ? stateOrListenerArg
        : undefined;

  const state = typeof stateOrListenerArg === 'function' ? undefined : stateOrListenerArg;

  useEventListener<Ably.ChannelState, Ably.ChannelStateChange>(channel, _listener, state);
}
