import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = resolve(__dirname, '../../dist/index.js');

describe('CLI E2E', () => {
  it('should show help text', async () => {
    const { stdout } = await execa('node', [CLI_PATH, '--help']);
    expect(stdout).toContain('Usage: agentsy [options] [command]');
    expect(stdout).toContain('Manage and unpack agent skills');
  });

  it('should list commands in help text', async () => {
    const { stdout } = await execa('node', [CLI_PATH, '--help']);
    expect(stdout).toContain('init');
    expect(stdout).toContain('unpack');
  });
});
