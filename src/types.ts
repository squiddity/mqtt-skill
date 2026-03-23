export interface MqttConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  clientId?: string;
}

export interface Message {
  topic: string;
  payload: unknown;
  timestamp: number;
}

export interface WatchOptions {
  hook?: string;
  token?: string;
  onMatch?: string;
  filter?: Record<string, unknown>;
  timeout?: number;
}
