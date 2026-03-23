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

  it('watch command validates topic argument', () => {
    try {
      execSync(`npx tsx ${cliPath} watch`, { encoding: 'utf-8' });
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('missing required args');
    }
  });

  it('watch command accepts --hook option', () => {
    vi.stubEnv('MQTT_HOST', 'mqtt://localhost');
    try {
      execSync(`npx tsx ${cliPath} watch test/# --hook http://example.com --timeout 1`, { encoding: 'utf-8', timeout: 5000 });
    } catch (err: any) {
      expect(err.stderr).toContain('ECONNREFUSED');
    }
  });

  it('watch command accepts --filter option with valid JSON', () => {
    vi.stubEnv('MQTT_HOST', 'mqtt://localhost');
    try {
      execSync(`npx tsx ${cliPath} watch test/# --filter \'{"key":"value"}\' --timeout 1`, { encoding: 'utf-8', timeout: 5000 });
    } catch (err: any) {
      expect(err.stderr).toContain('ECONNREFUSED');
    }
  });

  it('watch command rejects invalid --filter JSON', () => {
    try {
      execSync(`npx tsx ${cliPath} watch test/# --filter 'not-json'`, { encoding: 'utf-8' });
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('Invalid filter JSON');
    }
  });

  it('list command works', () => {
    vi.stubEnv('MQTT_HOST', 'mqtt://localhost');
    try {
      execSync(`npx tsx ${cliPath} list`, { encoding: 'utf-8', timeout: 10000 });
    } catch (err: any) {
      expect(err.stderr).toContain('ECONNREFUSED');
    }
  });
});
