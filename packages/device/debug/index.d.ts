import type { ClientOptions, PubSubClient } from '../index.js';

/**
 * Everything `@ably/pubsub-device` exports, from a build of it that keeps every log.
 *
 * On the web and React Native, the package root strips most logs below error level from the
 * client, so a `logLevel` above error there shows only part of what the client does. This entry
 * point is the same client with full logging, for diagnosing an app, in development or in
 * production. It is larger than the package root. On Node.js, the package root keeps every log,
 * and this entry point resolves to it.
 */
export * from '../index.js';

/**
 * Creates a Pub/Sub client for a device, exactly as the `createClient` of `@ably/pubsub-device`
 * does, from a build that keeps every log. Choose how much it logs with `ClientOptions.logLevel`.
 *
 * Except on Node.js, clients from this entry point and from the package root are separate copies
 * of the client. Errors from either pass `instanceof ErrorInfo` against the `ErrorInfo` exported by both.
 *
 * @param options - A client options object, an Ably API key, or an Ably token.
 */
export declare function createClient(options: ClientOptions | string): PubSubClient;
