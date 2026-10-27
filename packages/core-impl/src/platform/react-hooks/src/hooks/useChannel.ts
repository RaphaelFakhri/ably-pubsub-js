import * as Ably from '@ably/pubsub-core/api';
import { useEffect, useMemo, useRef } from 'react';
import { ChannelParameters } from '../PubSubReactHooks.js';
import { usePubSubClient } from './usePubSubClient.js';
import { useStateErrors } from './useStateErrors.js';
import { useChannelInstance } from './useChannelInstance.js';
import { useChannelAttach } from './useChannelAttach.js';

export type PubSubMessageCallback = Ably.messageCallback<Ably.Message>;

export interface ChannelResult {
  channel: Ably.RealtimeChannel;
  publish: Ably.RealtimeChannel['publish'];
  history: Ably.RealtimeChannel['history'];
  client: Ably.PubSubRealtimeClient;
  connectionError: Ably.ErrorInfo | null;
  channelError: Ably.ErrorInfo | null;
}

type SubscribeArgs = [string, PubSubMessageCallback] | [PubSubMessageCallback];

// The channel name can be omitted to use the channel from the nearest ChannelProvider.
export function useChannel(callbackOnMessage?: PubSubMessageCallback): ChannelResult;
export function useChannel(
  channelNameOrNameAndOptions: ChannelParameters,
  callbackOnMessage?: PubSubMessageCallback,
): ChannelResult;
export function useChannel(
  channelNameOrNameAndOptions: ChannelParameters,
  event: string,
  callbackOnMessage?: PubSubMessageCallback,
): ChannelResult;

export function useChannel(
  channelNameOrNameAndOptionsOrCallback?: ChannelParameters | PubSubMessageCallback,
  eventOrCallback?: string | PubSubMessageCallback,
  callback?: PubSubMessageCallback,
): ChannelResult {
  // The first argument is the message callback when the channel name is
  // inferred from a surrounding ChannelProvider, e.g. useChannel(listener).
  const inferChannelFromNearestProvider = typeof channelNameOrNameAndOptionsOrCallback === 'function';
  const channelNameOrNameAndOptions = inferChannelFromNearestProvider
    ? undefined
    : (channelNameOrNameAndOptionsOrCallback as ChannelParameters | undefined);
  const eventOrCallbackArg = inferChannelFromNearestProvider
    ? (channelNameOrNameAndOptionsOrCallback as PubSubMessageCallback)
    : eventOrCallback;

  const channelHookOptions =
    typeof channelNameOrNameAndOptions === 'object'
      ? channelNameOrNameAndOptions
      : channelNameOrNameAndOptions === undefined
        ? {}
        : { channelName: channelNameOrNameAndOptions };

  const client = usePubSubClient(channelHookOptions.contextId);
  const { skip } = channelHookOptions;

  const { channel, derived, channelName } = useChannelInstance(
    channelHookOptions.contextId,
    channelHookOptions.channelName,
  );

  const publish: Ably.RealtimeChannel['publish'] = useMemo(() => {
    if (!derived) return channel.publish.bind(channel);
    const regularChannel = client.channels.get(channelName);
    // For derived channels we use transient publish (it won't attach to the channel)
    return regularChannel.publish.bind(regularChannel);
  }, [client.channels, derived, channel, channelName]);

  const channelEvent = typeof eventOrCallbackArg === 'string' ? eventOrCallbackArg : null;
  const pubSubMessageCallback = typeof eventOrCallbackArg === 'string' ? callback : eventOrCallbackArg;

  const pubSubMessageCallbackRef = useRef(pubSubMessageCallback);

  const history: Ably.RealtimeChannel['history'] = useMemo(
    () => ((params?: Ably.RealtimeHistoryParams) => channel.history(params)) as Ably.RealtimeChannel['history'],
    [channel],
  );

  const { connectionError, channelError } = useStateErrors(channelHookOptions);

  useEffect(() => {
    pubSubMessageCallbackRef.current = pubSubMessageCallback;
  }, [pubSubMessageCallback]);

  useEffect(() => {
    const listener: PubSubMessageCallback | null = pubSubMessageCallbackRef.current
      ? (message) => {
          pubSubMessageCallbackRef.current && pubSubMessageCallbackRef.current(message);
        }
      : null;

    const subscribeArgs: SubscribeArgs | null = listener
      ? channelEvent === null
        ? [listener]
        : [channelEvent, listener]
      : null;

    if (!skip && subscribeArgs) {
      handleChannelMount(channel, ...subscribeArgs);
    }

    return () => {
      !skip && subscribeArgs && handleChannelUnmount(channel, ...subscribeArgs);
    };
  }, [channelEvent, channel, skip]);

  useChannelAttach(channel, channelHookOptions.contextId, skip);

  return { channel, publish, history, client, connectionError, channelError };
}

async function handleChannelMount(channel: Ably.RealtimeChannel, ...subscribeArgs: SubscribeArgs) {
  await (channel.subscribe as any)(...subscribeArgs);
}

async function handleChannelUnmount(channel: Ably.RealtimeChannel, ...subscribeArgs: SubscribeArgs) {
  await (channel.unsubscribe as any)(...subscribeArgs);
}
