import { goke } from 'goke';
import { z } from 'zod';
import { loadConfig, createClient, subscribeAndWait } from './mqtt.js';

const cli = goke('mqtt-skill');

cli
  .version('1.0.0');

cli
  .command('subscribe <topic>', 'Subscribe to a topic and wait for messages')
  .option('-l, --limit <limit>', z.number().default(10).describe('Number of messages to receive'))
  .option('-t, --timeout <timeout>', z.number().default(30).describe('Timeout in seconds'))
  .action(async (topic, options) => {
    const config = loadConfig();
    const client = createClient(config);

    await new Promise<void>((resolve) => {
      client.on('connect', () => resolve());
      client.on('error', (err) => { throw err; });
    });

    const messages = await subscribeAndWait(client, topic, options.limit, options.timeout);
    console.log(JSON.stringify(messages, null, 2));
  });

cli
  .command('publish <topic> <payload>', 'Publish a message to a topic')
  .action(async (topic, payload) => {
    const config = loadConfig();
    const client = createClient(config);

    await new Promise<void>((resolve) => {
      client.on('connect', () => resolve());
      client.on('error', (err) => { throw err; });
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      parsed = payload;
    }

    client.publish(topic, JSON.stringify(parsed), { qos: 1 });
    client.end();

    console.log(JSON.stringify({ success: true, topic, payload: parsed }));
  });

cli.parse();
