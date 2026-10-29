'use strict';

/**
 * The logging of `@ably/pubsub-device` and `@ably/pubsub-device/debug` on Node.js.
 *
 * On Node.js the package root keeps every log, and the debug entry point resolves to it. The
 * stripped root and full-logging debug builds the other platforms get are exercised in the browser,
 * by the package test (test/package/browser/template/src/index-pubsub-side.ts). Exercises the built
 * bundles through the workspace symlink, as pubsub_side_agent.test.js does; Node-only, like the rest
 * of test/unit.
 */
define(['chai'], function (chai) {
  const { expect } = chai;
  const PubSubDevice = require('@ably/pubsub-device');
  const PubSubDeviceDebug = require('@ably/pubsub-device/debug');

  const strippedWarning = 'this build of the client has most logs below error level stripped';

  describe('pubsub_device_debug', function () {
    it('@ably/pubsub-device logs below error level on Node.js, without the stripped-logs warning', function () {
      // The client never connects, so the logs are those of construction alone, which include
      // several below error level.
      const logs = [];
      const client = PubSubDevice.createClient({
        key: 'app.key:secret',
        autoConnect: false,
        logLevel: 4,
        logHandler: (message) => logs.push(message),
      });
      client.close();
      expect(logs.some((message) => message.includes('BaseClient(): started'))).to.equal(true);
      expect(logs.some((message) => message.includes(strippedWarning))).to.equal(false);
    });

    it('@ably/pubsub-device/debug resolves to the package root on Node.js', function () {
      expect(PubSubDeviceDebug).to.equal(PubSubDevice);
    });
  });
});
