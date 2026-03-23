import mqtt from 'mqtt';
import type { MqttConfig, Message } from './types.js';

export function loadConfig(): MqttConfig {
  const host = process.env.MQTT_HOST;
  if (!host) throw new Error('MQTT_HOST is required');

  return {
    host,
    port: parseInt(process.env.MQTT_PORT || '1883', 10),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID,
  };
}

export function createClient(config: MqttConfig) {
  const { host, port, username, password, clientId } = config;
  const url = `${host}:${port}`;

  const options: mqtt.IClientOptions = {
    clientId: clientId || `mqtt-skill-${Math.random().toString(36).slice(2, 10)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  };

  if (username) options.username = username;
  if (password) options.password = password;

  return mqtt.connect(url, options);
}

export async function subscribeAndWait(
  client: mqtt.MqttClient,
  topic: string,
  limit: number,
  timeout: number
): Promise<Message[]> {
  const messages: Message[] = [];

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.unsubscribe(topic);
      client.end();
      resolve(messages);
    }, timeout * 1000);

    client.on('message', (t, payload) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload.toString());
      } catch {
        parsed = payload.toString();
      }

      messages.push({
        topic: t,
        payload: parsed,
        timestamp: Date.now(),
      });

      if (messages.length >= limit) {
        clearTimeout(timer);
        client.unsubscribe(topic);
        client.end();
        resolve(messages);
      }
    });

    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        clearTimeout(timer);
        client.end();
        reject(err);
      }
    });
  });
}
