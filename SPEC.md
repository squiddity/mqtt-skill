# MQTT Agent Skill

A skill for LLM agents to interact with MQTT brokers — subscribe to topics, monitor messages, and publish on triggers.

## Design

- **Interface**: CLI tool (`mqtt-skill`) that can be invoked by agents
- **Auth**: Environment variables (`MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_CLIENT_ID`)
- **Topics**: Subscribe to topic patterns, receive JSON messages
- **Actions**: Run arbitrary commands or emit events when messages match patterns
- **Publish**: Send messages to arbitrary topics

## Commands

```bash
# Connect and subscribe to a topic pattern
mqtt-skill subscribe <topic-pattern> [--limit N] [--timeout seconds]

# Publish a message
mqtt-skill publish <topic> <payload-json>

# List matching topics (if broker supports $SYS)
mqtt-skill list

# Watch a topic pattern and run actions on matches
mqtt-skill watch <topic-pattern> --on-match "echo {{message}}"
```

## Example Usage

```bash
# Subscribe to sensor data
mqtt-skill subscribe "sensors/+/temperature" --timeout 30

# Watch for alerts and trigger actions
mqtt-skill watch "home/alerts" --on-match 'curl -X POST webhook.example.com -d "{{payload}}"'

# Publish a command to a device
mqtt-skill publish "devices/light1/set" '{"power": true}'
```

## File Structure

```
mqtt-agent-skill/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts      # CLI entry
│   ├── mqtt.ts       # MQTT client wrapper
│   ├── commands/
│   │   ├── subscribe.ts
│   │   ├── publish.ts
│   │   ├── list.ts
│   │   └── watch.ts
│   └── types.ts
└── skill.md          # For OpenCode skill loading
```

## Acceptance Criteria

1. Can connect to MQTT broker via env vars
2. Can subscribe and receive messages as JSON
3. Can publish messages to topics
4. Can watch topics and execute shell commands on match
5. Works as a standalone CLI
