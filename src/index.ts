import { goke } from 'goke';
import { z } from 'zod';
import { loadConfig, createClient, subscribeAndWait, watchTopics } from './mqtt.js';

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

cli
  .command('watch <topic>', 'Watch a topic and trigger actions on messages')
  .option('-h, --hook <url>', z.string().describe('Webhook URL to notify'))
  .option('--token <secret>', z.string().describe('Webhook auth token'))
  .option('-m, --on-match <cmd>', z.string().describe('Shell command to run on match'))
  .option('--filter <json>', z.string().describe('JSON filter for payload'))
  .option('-t, --timeout <sec>', z.number().describe('Timeout in seconds'))
  .action(async (topic, options) => {
    let filter: Record<string, unknown> | undefined;
    if (options.filter) {
      try {
        filter = JSON.parse(options.filter);
      } catch {
        console.error('Invalid filter JSON');
        process.exit(1);
      }
    }

    const config = loadConfig();
    const client = createClient(config);

    await new Promise<void>((resolve) => {
      client.on('connect', () => resolve());
      client.on('error', (err) => { throw err; });
    });

    watchTopics(client, topic, {
      hook: options.hook || undefined,
      token: options.token || undefined,
      onMatch: options.onMatch || undefined,
      filter,
      timeout: options.timeout || undefined,
    });
  });

cli
  .command('list', 'List available topics (requires $SYS support)')
  .option('-p, --pattern <pattern>', z.string().default('$SYS/#').describe('Topic pattern to list'))
  .option('-t, --timeout <sec>', z.number().default(5).describe('Timeout in seconds'))
  .action(async (options) => {
    const config = loadConfig();
    const client = createClient(config);

    await new Promise<void>((resolve) => {
      client.on('connect', () => resolve());
      client.on('error', (err) => { throw err; });
    });

    const messages = await subscribeAndWait(client, options.pattern, 100, options.timeout);
    console.log(JSON.stringify(messages, null, 2));
  });

cli.parse();
