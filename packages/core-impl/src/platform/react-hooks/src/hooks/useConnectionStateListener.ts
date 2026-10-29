import * as Ably from '@ably/pubsub-core/api';
import { usePubSubClient } from './usePubSubClient.js';
import { useEventListener } from './useEventListener.js';

type ConnectionStateListener = (stateChange: Ably.ConnectionStateChange) => any;

export function useConnectionStateListener(listener: ConnectionStateListener, contextId?: string);

export function useConnectionStateListener(
  state: Ably.ConnectionState | Ably.ConnectionState[],
  listener: ConnectionStateListener,
  contextId?: string,
);

export function useConnectionStateListener(
  stateOrListener?: Ably.ConnectionState | Ably.ConnectionState[] | ConnectionStateListener,
  listenerOrContextId?: string | ConnectionStateListener,
  contextId = 'default',
) {
  const _contextId = typeof listenerOrContextId === 'string' ? listenerOrContextId : contextId;
  const ably = usePubSubClient(_contextId);

  const listener =
    typeof listenerOrContextId === 'function' ? listenerOrContextId : (stateOrListener as ConnectionStateListener);
  const state = typeof stateOrListener !== 'function' ? stateOrListener : undefined;

  useEventListener<Ably.ConnectionState, Ably.ConnectionStateChange>(ably.connection, listener, state);
}
