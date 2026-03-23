import mqtt from 'mqtt';
import { exec } from 'child_process';
import type { MqttConfig, Message, WatchOptions } from './types.js';

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

export function watchTopics(
  client: mqtt.MqttClient,
  topic: string,
  options: WatchOptions
): void {
  const { hook, token, onMatch, filter, timeout } = options;
  const hookUrl = hook || 'http://127.0.0.1:18789/hooks/wake';

  const timer = timeout ? setTimeout(() => {
    client.unsubscribe(topic);
    client.end();
    process.exit(0);
  }, timeout * 1000) : null;

  client.on('message', async (t, payload) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.toString());
    } catch {
      parsed = payload.toString();
    }

    if (filter && typeof parsed === 'object' && parsed !== null) {
      const filterMatch = Object.entries(filter).every(([k, v]) => (parsed as Record<string, unknown>)[k] === v);
      if (!filterMatch) return;
    }

    const payloadStr = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
    const text = `MQTT message on ${t}: ${payloadStr}`;

    if (onMatch) {
      const cmd = onMatch.replace('{{message}}', payloadStr).replace('{{topic}}', t);
      exec(cmd, (err, stdout, stderr) => {
        if (err) console.error('Command error:', err);
        else if (stdout) console.log(stdout);
      });
    }

    if (hook) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const res = await fetch(hookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text,
            sessionKey: `mqtt:${t}`,
            wakeMode: 'now',
          }),
        });
        if (!res.ok) console.error('Webhook error:', res.status);
      } catch (e) {
        console.error('Failed to send webhook:', e);
      }
    }
  });

  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error('Subscribe error:', err);
      client.end();
      process.exit(1);
    }
    console.log(`Watching ${topic}...`);
  });
}
