import type { ClientOptions } from '@ably/pubsub-core/types';
import type { PubSubClient } from '@ably/pubsub-core/device';

/**
 * The core's type surface, minus the stateless HTTP client and the types only it reaches, plus the
 * device-only part that the client this package creates, {@link PubSubClient}, reaches. Safe as a
 * star re-export because it resolves at compile time only — see ../core-impl/side/core-exports.ts
 * for why the *runtime* re-export is enumerated instead.
 *
 * These are `@ably/pubsub-core/types` and `@ably/pubsub-core/device` rather than the package root
 * because this package offers no HTTP client, and TypeScript has no way to re-export a module minus
 * some names. The core keeps the HTTP-only declarations in a module of their own, which only the
 * root re-exports, and the device-only declarations in another, which the root does not.
 */
export * from '@ably/pubsub-core/types';
export * from '@ably/pubsub-core/device';

/**
 * Creates a Pub/Sub client for a device: a browser, a mobile app, or any other runtime
 * where the code is under an end user's control.
 *
 * Clients come only from this factory, or from the `createClient` of `@ably/pubsub-device/modular`
 * for the tree-shakable variant. The client declares its side by
 * sending an `ably-pubsub-device` entry in its `Ably-Agent`, which is what tells Ably this
 * connection belongs to a device.
 *
 * Device traffic counts toward your account's monthly active users. On an account billed
 * by MAU, a device connection must carry a client ID and is rejected at connect without
 * one, so set `clientId` here or issue tokens that carry one. A device client ID is also
 * subject to a per-client-ID concurrency limit.
 *
 * Use `createHttpClient` or `createRealtimeClient` from `@ably/pubsub-server` for a
 * backend service instead, so that its traffic is exempt from all three.
 *
 * On the web and React Native, this build of the client has most logs below error level stripped
 * from it, so a `logLevel` above error shows only part of what the client does: its protocol message
 * and HTTP request logs, a few warnings, and the plugins' logs. For full logging there, import
 * `createClient` from `@ably/pubsub-device/debug` instead. On Node.js, this build keeps every log.
 *
 * On the web and React Native, this build of the client also leaves MessagePack out, so it uses
 * JSON whatever `ClientOptions.useBinaryProtocol` says. To use the binary protocol there, pass the
 * `MsgPack` plugin from `@ably/pubsub-device/msgpack` in `ClientOptions.plugins`. On Node.js, the
 * client includes MessagePack and uses it by default.
 *
 * @param options - A client options object, an Ably API key, or an Ably token.
 */
export declare function createClient(options: ClientOptions | string): PubSubClient;
