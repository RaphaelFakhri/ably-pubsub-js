// Checks that the per-side Pub/Sub packages resolve, type-check and bundle the way a real
// consumer's toolchain sees them: installed from their own tarballs, with the core satisfying
// their exact dependency. That is worth exercising separately from the core because each
// package's declarations re-export the core's by bare specifier, so its types only resolve if the
// core resolves from inside it too.
//
// This covers resolution, types and bundling, plus the one behaviour that only the browser bundles
// have: the device's leaves MessagePack out until it is given the `MsgPack` plugin, and throws if
// asked for the binary protocol without it. The agent
// identifier each factory stamps — what declaring a side means, per the note in
// packages/device/README.md — is asserted on the wire in
// packages/core-impl/test/unit/pubsub_side_agent.test.js.
//
// Nothing here connects to Ably, so this file needs no sandbox key.
import * as PubSubDevice from '@ably/pubsub-device';
import * as PubSubDeviceDebug from '@ably/pubsub-device/debug';
import * as PubSubDeviceModular from '@ably/pubsub-device/modular';
import { MsgPack } from '@ably/pubsub-device/msgpack';
import { Push } from '@ably/pubsub-device/push';
import { LiveObjects, LiveMap, LiveCounter } from '@ably/pubsub-device/liveobjects';
import * as PubSubServer from '@ably/pubsub-server';

declare module globalThis {
  var testAblyPackage: () => Promise<void>;
}

// Both packages re-export the core's type surface, so a consumer can annotate with the types
// without also depending on `@ably/pubsub-core` directly.
async function attachChannel(channel: PubSubDevice.RealtimeChannel) {
  await channel.attach();
}

function inspectStats(page: PubSubServer.PaginatedResult<PubSubServer.Stats>) {
  return page.items.length;
}

// Constructs a client that never connects and returns whether it settled on the binary protocol.
// The resolved options are not on the public type, hence the cast.
function usesBinaryProtocol(
  createClient: (options: PubSubDevice.ClientOptions) => PubSubDevice.PubSubClient,
  options: PubSubDevice.ClientOptions,
) {
  const client = createClient({ key: 'app.key:secret', autoConnect: false, ...options });
  try {
    return (client as unknown as { options: { useBinaryProtocol: boolean } }).options.useBinaryProtocol;
  } finally {
    client.close();
  }
}

// Constructs a client at the most verbose log level and returns everything it logged. The client
// never connects, so the logs are those of construction alone, which include several below error
// level and, from a stripped build, the warning that its logs are stripped.
function logsOfConstruction(createClient: typeof PubSubDevice.createClient) {
  const logs: string[] = [];
  const client = createClient({
    key: 'app.key:secret',
    autoConnect: false,
    clientId: 'someone',
    logLevel: 4,
    logHandler: (message) => logs.push(message),
  });
  client.close();
  return logs;
}

globalThis.testAblyPackage = async function () {
  const device = PubSubDevice.createClient({ key: 'app.key:secret', autoConnect: false, clientId: 'someone' });
  const serverRealtime = PubSubServer.createRealtimeClient({ key: 'app.key:secret', autoConnect: false });
  const serverHttp = PubSubServer.createHttpClient({ key: 'app.key:secret' });

  // Check the factories return the client kinds their declarations promise.
  const deviceChannel: PubSubDevice.RealtimeChannel = device.channels.get('channel');
  const serverChannel: PubSubServer.RealtimeChannel = serverRealtime.channels.get('channel');
  void attachChannel;
  void inspectStats;
  void deviceChannel;
  void serverChannel;
  void serverHttp.request;

  // In the browser, the root strips most logs below error level, and the debug subpath is the same
  // client with full logging, so the same client options log only the stripped-logs warning from
  // the one and everything, without that warning, from the other.
  const strippedWarning = 'this build of the client has most logs below error level stripped';
  const rootLogs = logsOfConstruction(PubSubDevice.createClient);
  if (rootLogs.length !== 1 || !rootLogs[0].includes(strippedWarning)) {
    throw new Error(`the root should log only the stripped-logs warning, but logged: ${JSON.stringify(rootLogs)}`);
  }
  const debugLogs = logsOfConstruction(PubSubDeviceDebug.createClient);
  if (!debugLogs.some((message) => message.includes('BaseClient(): started'))) {
    throw new Error('the debug entry point did not log below error level');
  }
  if (debugLogs.some((message) => message.includes(strippedWarning))) {
    throw new Error('the debug entry point logged the stripped-logs warning');
  }

  // The debug subpath exports what the root does, under the root's types. Its client is a separate
  // copy of the root's, but shares the core's one runtime ErrorInfo, so that an error from either
  // passes `instanceof` against both.
  if (Object.keys(PubSubDeviceDebug).sort().join() !== Object.keys(PubSubDevice).sort().join()) {
    throw new Error('the debug entry point does not export what the root exports');
  }
  const debugDevice: PubSubDevice.PubSubClient = PubSubDeviceDebug.createClient({
    key: 'app.key:secret',
    autoConnect: false,
    clientId: 'someone',
  });
  if (PubSubDeviceDebug.ErrorInfo !== PubSubDevice.ErrorInfo) {
    throw new Error('the debug entry point does not share the root ErrorInfo');
  }
  debugDevice.close();

  // The modular subpath re-exports the tree-shakable variant and adds its own side-stamping
  // factory. It is ESM-only, so this also checks the `import` condition resolves on its own.
  const modularDevice: PubSubDevice.PubSubClient = PubSubDeviceModular.createClient({
    key: 'app.key:secret',
    autoConnect: false,
    clientId: 'someone',
    plugins: {
      WebSocketTransport: PubSubDeviceModular.WebSocketTransport,
      FetchRequest: PubSubDeviceModular.FetchRequest,
    },
  });
  // The client classes behind the factory are internal: a modular client is created with
  // `createClient` and typed as `PubSubClient`, as the root's is.
  if ('BaseRealtime' in PubSubDeviceModular || 'BaseHttp' in PubSubDeviceModular) {
    throw new Error('the modular subpath exports a client class');
  }
  modularDevice.close();

  // Every plugin subpath exports under a name, so registering one reads the same way whichever
  // plugin it is. Each has to be the object the core exports, or the client would not recognise it.
  const withPlugins = PubSubDevice.createClient({
    key: 'app.key:secret',
    autoConnect: false,
    clientId: 'someone',
    useBinaryProtocol: true,
    plugins: { Push, LiveObjects, MsgPack },
  });
  void withPlugins.channels.get('channel').push;
  withPlugins.close();

  // The device's browser bundles leave MessagePack out, so a client from them uses JSON until it is
  // given the `MsgPack` plugin, and refuses to be constructed if it asks for the binary protocol
  // without it. Both the root and the debug entry point are checked, since each is its own bundle.
  for (const [entryPoint, createClient] of [
    ['@ably/pubsub-device', PubSubDevice.createClient],
    ['@ably/pubsub-device/debug', PubSubDeviceDebug.createClient],
  ] as const) {
    const cases: [PubSubDevice.ClientOptions, boolean][] = [
      [{}, false],
      [{ useBinaryProtocol: true, plugins: { MsgPack } }, true],
      [{ plugins: { MsgPack } }, false],
    ];
    for (const [options, expected] of cases) {
      if (usesBinaryProtocol(createClient, options) !== expected) {
        throw new Error(
          `a ${entryPoint} client with ${JSON.stringify(options)} should use ${expected ? 'MessagePack' : 'JSON'}`,
        );
      }
    }

    let missingPluginError: unknown;
    try {
      usesBinaryProtocol(createClient, { useBinaryProtocol: true });
    } catch (error) {
      missingPluginError = error;
    }
    if (!(missingPluginError instanceof PubSubDevice.ErrorInfo) || missingPluginError.code !== 40019) {
      throw new Error(
        `a ${entryPoint} client with useBinaryProtocol: true and no MsgPack plugin should throw ErrorInfo 40019, but got ${missingPluginError}`,
      );
    }
  }

  // `LiveMap` and `LiveCounter` are values as well as types: their static `create()` builds the value
  // to assign to an object path.
  const initialMap = LiveMap.create({ count: LiveCounter.create(1) });
  void initialMap;

  // Check the device client extends the core's PubSubRealtimeClient, which the server's realtime
  // client is, that the device-only types stay off the server, and that the static helpers are
  // classes both packages export by name.
  const deviceClient: PubSubDevice.PubSubClient = device;
  const baseClient: PubSubDevice.PubSubRealtimeClient = deviceClient;
  void baseClient;
  const serverBaseClient: PubSubServer.PubSubRealtimeClient = serverRealtime;
  void serverBaseClient;
  // @ts-expect-error
  type ServerDeviceClient = PubSubServer.PubSubClient;
  // @ts-expect-error
  type ServerDevicePush = PubSubServer.DevicePush;
  const presenceMessage: PubSubServer.PresenceMessage = PubSubServer.PresenceMessage.fromValues({ clientId: 'x' });
  void presenceMessage;
  void PubSubDevice.Message.fromEncoded;
  void PubSubDevice.Annotation.fromEncodedArray;
  void PubSubDevice.Crypto.generateRandomKey;

  // A client constructed directly declares no side, so neither package exposes a client class.
  // @ts-expect-error
  void PubSubDevice.DefaultPubSubRealtimeClient;
  // @ts-expect-error
  void PubSubServer.DefaultPubSubHttpClient;

  // The device has no HTTP client, so neither its factory nor the types only it reaches are exported.
  // @ts-expect-error
  void PubSubDevice.createHttpClient;
  // @ts-expect-error
  type DeviceHttpClient = PubSubDevice.PubSubHttpClient;
  // @ts-expect-error
  type DeviceHttpChannel = PubSubDevice.HttpChannel;
  // @ts-expect-error
  void PubSubDeviceModular.BaseRealtime;
  // @ts-expect-error
  void PubSubDeviceModular.BaseHttp;
  const serverHttpChannel: PubSubServer.HttpChannel = serverHttp.channels.get('channel');
  void serverHttpChannel;

  // A server is not a push target, so both server clients offer only push admin. Activating a
  // device for push is the device client's concern.
  void serverHttp.push.admin;
  // @ts-expect-error
  void serverHttp.push.activate;
  // @ts-expect-error
  void serverHttp.getDevice;
  void serverRealtime.push.admin;
  // @ts-expect-error
  void serverRealtime.push.activate;
  // @ts-expect-error
  void serverRealtime.push.deactivate;
  // @ts-expect-error
  void serverRealtime.getDevice;
  void device.push.admin;
  void device.push.activate;
  void device.getDevice;

  // Subscribing to push on a channel subscribes the local device or its clientId, so only the
  // device's channels offer it, and only the device's options take the Push plugin.
  // @ts-expect-error
  void serverHttp.channels.get('channel').push;
  // @ts-expect-error
  void serverRealtime.channels.get('channel').push;
  // @ts-expect-error
  type ServerPushChannel = PubSubServer.PushChannel;
  // @ts-expect-error
  const serverWithPush = () => PubSubServer.createRealtimeClient({ key: 'app.key:secret', plugins: { Push } });
  void serverWithPush;
  const pushChannel: PubSubDevice.RealtimeChannel = device.channels.get('channel');
  void pushChannel.push.subscribeDevice;
  // The device's ClientOptions is the one that takes the Push plugin and the web push options, so
  // an options object annotated with it, rather than with an explicit plugin map, still compiles.
  const deviceOptions: PubSubDevice.ClientOptions = {
    key: 'app.key:secret',
    autoConnect: false,
    plugins: { Push },
    pushServiceWorkerUrl: '/sw.js',
  };
  void deviceOptions;
  // @ts-expect-error
  const serverOptions: PubSubServer.ClientOptions = { key: 'app.key:secret', pushServiceWorkerUrl: '/sw.js' };
  void serverOptions;

  // Check the re-exported error type is the core's, so instanceof works across the boundary.
  const error: PubSubDevice.ErrorInfo = new PubSubDevice.ErrorInfo('message', 40000, 400);
  if (!(error instanceof PubSubServer.ErrorInfo)) {
    throw new Error('the two packages disagree about ErrorInfo, so more than one core is installed');
  }

  device.close();
  serverRealtime.close();
};
