import type { ClientOptions, PubSubClient } from '@ably/pubsub-core/device';
import { DefaultPubSubRealtimeClient } from '../../core-impl/side/core-clients';
import { deviceAgentIdentifier, optionsWithSideAgent } from '../../core-impl/side/side';

// The public value surface besides the factories. See ../../core-impl/side/core-exports.ts for why
// the list is enumerated.
export { ErrorInfo, Crypto, Message, PresenceMessage, Annotation } from '../../core-impl/side/core-exports';

// The contract, and the MAU consequences of being on the device side, are documented on
// the declaration in ../index.d.ts, which is what consumers see. Following the implementation,
// which keeps its documentation in declaration files rather than duplicating it here.
export function createClient(options: ClientOptions | string): PubSubClient {
  // The realtime class implements the device APIs that PubSubClient adds to PubSubRealtimeClient,
  // so the assertion is sound. Only the device package exposes them.
  return new DefaultPubSubRealtimeClient(optionsWithSideAgent(options, deviceAgentIdentifier)) as PubSubClient;
}
