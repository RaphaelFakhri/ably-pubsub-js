/**
 * The part of the Pub/Sub type surface that only the client from `@ably/pubsub-device` uses: the APIs
 * that act on the local device as a target for push notifications.
 *
 * It is a module of its own, reached only through `@ably/pubsub-core/device`, so that the rest of
 * the surface, which `@ably/pubsub-server` star-exports, carries none of it. ./ably.d.ts, the
 * package root, does not re-export it.
 */

/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import type {
  Channels,
  ClientOptions as BaseClientOptions,
  CorePlugins,
  DeregisterCallback,
  ErrorCallback,
  ErrorInfo,
  PaginatedResult,
  PubSubRealtimeClient,
  Push,
  PushAdmin,
  PushChannelSubscription,
  PushDeviceToken,
  RealtimeChannel as BaseRealtimeChannel,
  RegisterCallback,
} from './types';
/* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars */

/**
 * A Pub/Sub client for a device, as `createClient` from `@ably/pubsub-device` returns it.
 *
 * It is a {@link PubSubRealtimeClient} with the APIs that act on the local device as a target for push notifications: {@link PubSubClient.getDevice | `getDevice()`}, a {@link DevicePush} object in place of {@link Push}, and channels that are this module's {@link RealtimeChannel}, which adds `push` to the shared one.
 */
export declare interface PubSubClient extends PubSubRealtimeClient {
  /**
   * A {@link Channels} object of {@link RealtimeChannel} objects.
   */
  channels: Channels<RealtimeChannel>;
  /**
   * A {@link DevicePush} object.
   */
  push: DevicePush;
  /**
   * Retrieves a {@link LocalDevice} object that represents the current state of the device as a target for push notifications, loading it from persistent storage if necessary.
   *
   * @returns A promise which resolves to a {@link LocalDevice} object.
   */
  getDevice(): Promise<LocalDevice>;
}

/**
 * A channel of a {@link PubSubClient}: the shared `RealtimeChannel`, with the {@link PushChannel} that subscribes the local device to push notifications for the channel.
 *
 * It has the same name as the shared one, and `@ably/pubsub-device` exports it in that one's place, so device code names its channels `RealtimeChannel` as on a server.
 */
export declare interface RealtimeChannel extends BaseRealtimeChannel {
  /**
   * A {@link PushChannel} object that manages device push notification subscriptions for this channel. Accessing this property requires the `Push` plugin to be registered via {@link ClientOptions.plugins}. The default and modular builds do not bundle the `Push` plugin. If the plugin is absent, the getter throws an {@link ErrorInfo} rather than returning a {@link PushChannel}.
   *
   * @see https://ably.com/docs/pub-sub/api/javascript/realtime/realtime-channel#properties
   */
  push: PushChannel;
}

/**
 * Enables devices to subscribe to push notifications for a channel.
 */
export declare interface PushChannel {
  /**
   * Subscribes the device to push notifications for the channel.
   */
  subscribeDevice(): Promise<void>;

  /**
   * Unsubscribes the device from receiving push notifications for the channel.
   */
  unsubscribeDevice(): Promise<void>;

  /**
   * Subscribes all devices associated with the current device's `clientId` to push notifications for the channel.
   */
  subscribeClient(): Promise<void>;

  /**
   * Unsubscribes all devices associated with the current device's `clientId` from receiving push notifications for the channel.
   */
  unsubscribeClient(): Promise<void>;

  /**
   * Retrieves all push subscriptions for the channel. Subscriptions can be filtered using a params object.
   *
   * @param params - An object containing key-value pairs to filter subscriptions by. Can contain `clientId`, `deviceId` or a combination of both, and a `limit` on the number of subscriptions returned, up to 1,000.
   * @returns a {@link PaginatedResult} object containing an array of {@link PushChannelSubscription} objects.
   */
  listSubscriptions(params?: Record<string, string>): Promise<PaginatedResult<PushChannelSubscription>>;
}

/**
 * The options of a client from `createClient` from `@ably/pubsub-device`: the shared `ClientOptions`, with the {@link DevicePlugins} as the default plugin map, and the options of the local device as a push target.
 *
 * It has the same name as the shared one, and `@ably/pubsub-device` exports it in that one's place, so device code names its options `ClientOptions` as on a server.
 */
export interface ClientOptions<Plugins = DevicePlugins> extends BaseClientOptions<Plugins> {
  /**
   * A URL pointing to a service worker script which is used as the target for web push notifications.
   */
  pushServiceWorkerUrl?: string;
}

/**
 * Describes the {@link ClientOptions.plugins | plugins} accepted by `createClient` from `@ably/pubsub-device`: those of {@link CorePlugins}, and the `Push` plugin.
 */
export interface DevicePlugins extends CorePlugins {
  /**
   * A plugin which allows the client to be the target of push notifications.
   */
  Push?: unknown;
}

/**
 * Enables a device to be registered and deregistered from receiving push notifications, as well as the management of push notifications through {@link Push.admin}.
 */
export declare interface DevicePush extends Push {
  /**
   * Activates the device for push notifications. Subsequently registers the device with Ably and stores the deviceIdentityToken in local storage.
   *
   * @param registerCallback - A function passed to override the default implementation to register the local device for push activation.
   * @param updateFailedCallback - A callback to be invoked when the device registration failed to update.
   */
  activate(registerCallback?: RegisterCallback, updateFailedCallback?: ErrorCallback): Promise<void>;

  /**
   * Deactivates the device from receiving push notifications.
   *
   * @param deregisterCallback - A function passed to override the default implementation to deregister the local device for push activation.
   */
  deactivate(deregisterCallback?: DeregisterCallback): Promise<void>;

  /**
   * Updates the device's push token after the underlying push platform has rotated it, and synchronizes the new token with Ably by updating the device registration. Call this from your platform's token refresh listener, for example `messaging().onTokenRefresh()` of `@react-native-firebase/messaging`, once {@link activate | `activate()`} has completed.
   *
   * The synchronization with Ably is fire-and-forget: it is serialized with any in-flight `activate()`, `deactivate()` or earlier `updateToken()` synchronization rather than racing it, it is routed through the `registerCallback` passed to `activate()` when one was provided, and a synchronization failure is reported to the `updateFailedCallback` passed to `activate()`.
   *
   * @param token - The refreshed push token, in the same shape as returned by the `requestToken` callback of the `@ably/pubsub-core/react-native-push` plugin.
   * @returns A promise which resolves once the refreshed token has been persisted locally and its synchronization with Ably has been initiated, and rejects if the token is malformed or the device is not activated for push notifications.
   */
  updateToken(token: PushDeviceToken): Promise<void>;
}

/**
 * Contains the device identity token and secret of a device.
 */
export declare interface LocalDevice {
  /**
   * A unique ID generated by the device.
   */
  id: string;
  /**
   * A unique device secret generated by the Ably SDK.
   */
  deviceSecret: string;
  /**
   * A unique device identity token that the device uses to authenticate itself with Ably.
   */
  deviceIdentityToken?: string;

  /**
   * Retrieves push subscriptions active for the local device.
   *
   * @returns a {@link PaginatedResult} object containing an array of {@link PushChannelSubscription} objects for each push channel subscription active for the local device.
   */
  listSubscriptions(): Promise<PaginatedResult<PushChannelSubscription>>;
}
