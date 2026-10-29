/**
 * The full public type surface of the React hooks.
 *
 * Use these with a client from `createClient()`:
 *
 * ```javascript
 * import { createClient } from '@ably/pubsub-device';
 * import { PubSubClientProvider, useChannel } from '@ably/pubsub-device/react';
 *
 * const client = createClient({ key: 'your-ably-api-key', clientId: 'me' });
 * // <PubSubClientProvider client={client}> ... </PubSubClientProvider>
 * ```
 */
export * from '../dist/react/cjs/index.js';
