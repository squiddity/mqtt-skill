import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, '../src/index.ts');

describe('CLI integration', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('MQTT_HOST', 'mqtt://localhost');
    vi.stubEnv('MQTT_PORT', '1883');
    vi.stubEnv('MQTT_USERNAME', undefined);
    vi.stubEnv('MQTT_PASSWORD', undefined);
  });

  it('--version shows version', () => {
    const output = execSync(`npx tsx ${cliPath} --version`, { encoding: 'utf-8' });
    expect(output).toContain('1.0.0');
  });

  it('subscribe command validates topic argument', () => {
    try {
      execSync(`npx tsx ${cliPath} subscribe`, { encoding: 'utf-8' });
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('missing required args');
    }
  });

  it('publish command validates topic argument', () => {
    try {
      execSync(`npx tsx ${cliPath} publish`, { encoding: 'utf-8' });
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('missing required args');
    }
  });

  it('publish command validates payload argument', () => {
    try {
      execSync(`npx tsx ${cliPath} publish test-topic`, { encoding: 'utf-8' });
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('missing required args');
    }
  });

  it('unknown command shows error', () => {
    try {
      execSync(`npx tsx ${cliPath} unknown-command`, { encoding: 'utf-8' });
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('unknown command');
    }
  });
});
