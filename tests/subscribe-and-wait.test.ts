import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { subscribeAndWait } from '../src/mqtt.js';
import { createMockClient, simulateMessage, simulateConnect } from './mqtt-mock.js';

describe('subscribeAndWait', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('collects messages up to limit, then resolves', async () => {
    const client = createMockClient();
    simulateConnect(client);

    const promise = subscribeAndWait(client, 'test/topic', 3, 30);

    simulateMessage(client, 'test/topic', '{"id": 1}');
    simulateMessage(client, 'test/topic', '{"id": 2}');
    simulateMessage(client, 'test/topic', '{"id": 3}');

    const messages = await promise;

    expect(messages).toHaveLength(3);
    expect(messages[0].payload).toEqual({ id: 1 });
    expect(messages[1].payload).toEqual({ id: 2 });
    expect(messages[2].payload).toEqual({ id: 3 });
    expect(client.disconnected).toBe(true);
  });

  it('resolves on timeout with partial results', async () => {
    const client = createMockClient();
    simulateConnect(client);

    const promise = subscribeAndWait(client, 'test/topic', 10, 2);

    simulateMessage(client, 'test/topic', 'first');

    vi.advanceTimersByTime(2100);

    const messages = await promise;

    expect(messages).toHaveLength(1);
    expect(messages[0].payload).toBe('first');
  });

  it('parses JSON payloads correctly', async () => {
    const client = createMockClient();
    simulateConnect(client);

    const promise = subscribeAndWait(client, 'test/topic', 1, 30);

    simulateMessage(client, 'test/topic', '{"key": "value", "num": 42}');

    const messages = await promise;

    expect(messages[0].payload).toEqual({ key: 'value', num: 42 });
  });

  it('returns raw string for non-JSON payloads', async () => {
    const client = createMockClient();
    simulateConnect(client);

    const promise = subscribeAndWait(client, 'test/topic', 1, 30);

    simulateMessage(client, 'test/topic', 'plain text message');

    const messages = await promise;

    expect(messages[0].payload).toBe('plain text message');
  });

  it('includes topic and timestamp in message', async () => {
    const client = createMockClient();
    simulateConnect(client);

    const beforeTime = Date.now();
    const promise = subscribeAndWait(client, 'test/topic', 1, 30);

    simulateMessage(client, 'test/topic', '{}');
    const messages = await promise;
    const afterTime = Date.now();

    expect(messages[0].topic).toBe('test/topic');
    expect(messages[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(messages[0].timestamp).toBeLessThanOrEqual(afterTime);
  });

  it('cleans up (unsubscribe + end) on completion', async () => {
    const client = createMockClient();
    simulateConnect(client);

    const promise = subscribeAndWait(client, 'test/topic', 1, 30);
    simulateMessage(client, 'test/topic', '{}');
    
    await promise;

    expect(client.disconnected).toBe(true);
  });

  it('rejects on subscribe error', async () => {
    const client = createMockClient();
    
    client.subscribe = function(_topic: string, _opts: any, callback: (err: Error) => void) {
      callback(new Error('Subscribe failed'));
      return client;
    };

    const promise = subscribeAndWait(client, 'test/topic', 1, 30);

    await expect(promise).rejects.toThrow('Subscribe failed');
  });

  it('handles binary payloads', async () => {
    const client = createMockClient();
    simulateConnect(client);

    const promise = subscribeAndWait(client, 'test/topic', 1, 30);

    simulateMessage(client, 'test/topic', Buffer.from([0x00, 0x01, 0x02]));

    const messages = await promise;

    expect(messages[0].payload).toEqual(Buffer.from([0x00, 0x01, 0x02]).toString());
  });
});