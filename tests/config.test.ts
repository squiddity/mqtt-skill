import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig } from '../src/mqtt.js';

describe('loadConfig', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws when MQTT_HOST is missing', () => {
    delete process.env.MQTT_HOST;
    expect(() => loadConfig()).toThrow('MQTT_HOST is required');
  });

  it('loads config from environment variables', () => {
    vi.stubEnv('MQTT_HOST', 'mqtt://localhost');
    vi.stubEnv('MQTT_PORT', '1883');
    vi.stubEnv('MQTT_USERNAME', 'user');
    vi.stubEnv('MQTT_PASSWORD', 'pass');
    vi.stubEnv('MQTT_CLIENT_ID', 'test-client');
    
    const config = loadConfig();
    
    expect(config.host).toBe('mqtt://localhost');
    expect(config.port).toBe(1883);
    expect(config.username).toBe('user');
    expect(config.password).toBe('pass');
    expect(config.clientId).toBe('test-client');
  });

  it('uses defaults for optional fields', () => {
    vi.stubEnv('MQTT_HOST', 'mqtt://localhost');
    vi.stubEnv('MQTT_PORT', undefined);
    vi.stubEnv('MQTT_USERNAME', undefined);
    vi.stubEnv('MQTT_PASSWORD', undefined);
    vi.stubEnv('MQTT_CLIENT_ID', undefined);
    
    const config = loadConfig();
    
    expect(config.port).toBe(1883);
    expect(config.username).toBeUndefined();
    expect(config.password).toBeUndefined();
    expect(config.clientId).toBeUndefined();
  });
});
