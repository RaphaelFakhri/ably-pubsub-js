import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type * as Ably from '@ably/pubsub-core';
import { FakeAblySdk, FakeAblyChannels } from '../fakes/ably.js';
import { PubSubClientProvider } from '../PubSubClientProvider.js';
import { usePubSubClient } from './usePubSubClient.js';
import { useChannel } from './useChannel.js';
import { usePresence } from './usePresence.js';

const expectedMessage =
  'Could not find ably client in context. Make sure your ably hooks are called inside an <PubSubClientProvider>';

// React logs errors thrown during render to the console, which is noise here.
const silenceConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => undefined);

/** @nospec */
describe('hooks called outside an PubSubClientProvider', () => {
  it('usePubSubClient throws a descriptive error', () => {
    const spy = silenceConsoleError();
    expect(() => renderHook(() => usePubSubClient())).toThrow(expectedMessage);
    spy.mockRestore();
  });

  it('useChannel throws a descriptive error', () => {
    const spy = silenceConsoleError();
    expect(() => renderHook(() => useChannel('channel', vi.fn()))).toThrow(expectedMessage);
    spy.mockRestore();
  });

  it('usePresence throws a descriptive error', () => {
    const spy = silenceConsoleError();
    expect(() => renderHook(() => usePresence('channel'))).toThrow(expectedMessage);
    spy.mockRestore();
  });

  it('usePubSubClient throws a descriptive error when the requested contextId has no provider', () => {
    const spy = silenceConsoleError();
    const client = new FakeAblySdk().connectTo(new FakeAblyChannels(['channel']));
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PubSubClientProvider client={client as unknown as Ably.PubSubRealtimeClient}>{children}</PubSubClientProvider>
    );
    expect(() => renderHook(() => usePubSubClient('missing'), { wrapper })).toThrow(expectedMessage);
    spy.mockRestore();
  });
});
