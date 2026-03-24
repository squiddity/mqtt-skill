import { EventEmitter } from 'events';

interface MockMqttClient extends EventEmitter {
  connected: boolean;
  disconnected: boolean;
  reconnecting: boolean;
  subscribe(topic: string, opts?: any, callback?: (err: Error | null) => void): any;
  unsubscribe(topic: string, callback?: (err: Error | null) => void): any;
  publish(topic: string, payload: any, opts?: any, callback?: (err: Error | null) => void): any;
  end(force?: boolean, opts?: any, callback?: (err: Error | null) => void): any;
}

export function createMockClient(): MockMqttClient {
  const emitter = new EventEmitter();
  
  let client = emitter as MockMqttClient;
  client.connected = false;
  client.disconnected = true;
  client.reconnecting = false;
  
  let subscriptions: Map<string, any> = new Map();
  
  client.subscribe = function(topic: string, opts: any = {}, callback?: (err: Error | null) => void) {
    subscriptions.set(topic, opts);
    if (callback) callback(null);
    return client;
  };
  
  client.unsubscribe = function(topic: string, callback?: (err: Error | null) => void) {
    subscriptions.delete(topic);
    setTimeout(() => {
      if (callback) callback(null);
    }, 0);
    return client;
  };
  
  client.publish = function(topic: string, payload: any, opts: any = {}, callback?: (err: Error | null) => void) {
    setTimeout(() => {
      if (callback) callback(null);
    }, 0);
    return client;
  };
  
  client.end = function(force?: boolean, opts?: any, callback?: (err: Error | null) => void) {
    client.connected = false;
    client.disconnected = true;
    emitter.emit('close');
    setTimeout(() => {
      if (callback) callback(null);
    }, 0);
    return client;
  };
  
  return client;
}

export function connectMock(): MockClient {
  return createMockClient();
}

export function simulateMessage(client: MockClient, topic: string, payload: string | Buffer): void {
  const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  client.emit('message', topic, payloadBuffer);
}

export function simulateConnect(client: MockClient): void {
  client.connected = true;
  client.disconnected = false;
  client.emit('connect');
}

export function simulateError(client: MockClient, error: Error): void {
  client.emit('error', error);
}

export function simulateClose(client: MockClient): void {
  client.connected = false;
  client.disconnected = true;
  client.emit('close');
}