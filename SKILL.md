---
name: mqtt
description: >
  mqtt-skill is an MQTT CLI for LLM agents. Always run `mqtt-skill --help` to see available commands.
---

# mqtt-skill

MQTT agent skill for LLM agents to interact with MQTT brokers — subscribe to topics, monitor messages, and publish on triggers.

## Always Run Help First

```
mqtt-skill --help
mqtt-skill <command> --help
```

## Configuration

Set these environment variables before using:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MQTT_HOST` | Yes | - | Broker hostname |
| `MQTT_PORT` | No | 1883 | Broker port |
| `MQTT_USERNAME` | No | - | Username (optional) |
| `MQTT_PASSWORD` | No | - | Password (optional) |
| `MQTT_CLIENT_ID` | No | auto-generated | Client ID |

## Commands

### subscribe

Subscribe to a topic and wait for messages.

```
mqtt-skill subscribe <topic> [-l|--limit N] [-t|--timeout seconds]
```

**Options:**
- `-l, --limit <N>` — Number of messages to receive (default: 10)
- `-t, --timeout <seconds>` — Timeout in seconds (default: 30)

**Example:**
```
mqtt-skill subscribe sensors/+/temperature --limit 5 --timeout 60
```

### publish

Publish a message to a topic.

```
mqtt-skill publish <topic> <payload>
```

**Example:**
```
mqtt-skill publish devices/light1/set '{"power": true}'
```

## Usage for Agents

Agents should:
1. Read `MQTT_HOST`, `MQTT_PORT`, etc. from environment
2. Use `subscribe` to wait for messages on a topic
3. Use `publish` to send commands to devices
4. Parse JSON responses from `subscribe` output

**Base directory:** file:///home/squiddity/.kimaki/projects/mqtt-agent-skill
