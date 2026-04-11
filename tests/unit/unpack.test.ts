import fs from 'fs-extra';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { unpackCommand } from '@/commands/unpack.js';

vi.mock('fs-extra', () => ({
  default: {
    copy: vi.fn(),
    ensureDir: vi.fn(),
    ensureSymlink: vi.fn(),
    existsSync: vi.fn(),
    pathExists: vi.fn(),
    readdir: vi.fn(),
    readJSON: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('unpackCommand', () => {
  const MOCK_ROOT_DIR = '/fake/dir';
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;
  let consoleWarnSpy: MockInstance;
  let processExitSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'cwd').mockReturnValue(MOCK_ROOT_DIR);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    }) as unknown as MockInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should exit if config file not found', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await expect(unpackCommand()).rejects.toThrow('process.exit called');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Configuration file agentsy.json not found. Run `agentsy init` first.',
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit if source directory not found', async () => {
    vi.mocked(fs.existsSync).mockImplementation(((p: string) => p.endsWith('agentsy.json')) as any);
    vi.mocked(fs.readJSON).mockResolvedValue({ sourceDir: './non-existent-skills' });

    await expect(unpackCommand()).rejects.toThrow('process.exit called');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Source directory not found:'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should warn if no skills are found', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readJSON).mockResolvedValue({ sourceDir: './skills', targetAgents: ['.gemini'] });
    vi.mocked(fs.readdir).mockResolvedValue([] as any);

    await unpackCommand();
    expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️  No skills found in source directory.');
  });

  it('should copy skills to target agents', async () => {
    const config = { sourceDir: './skills', syncMode: 'copy', targetAgents: ['.gemini'] };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readJSON).mockResolvedValue(config);
    vi.mocked(fs.readdir).mockResolvedValue(['skill1.ts', 'skill2.ts'] as any);

    await unpackCommand();

    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(MOCK_ROOT_DIR, '.gemini', 'skills'));
    expect(fs.copy).toHaveBeenCalledTimes(2);
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(MOCK_ROOT_DIR, 'skills', 'skill1.ts'),
      path.join(MOCK_ROOT_DIR, '.gemini', 'skills', 'skill1.ts'),
      { overwrite: true },
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Synced to .gemini/skills');
  });

  it('should symlink skills to target agents', async () => {
    const config = { sourceDir: './skills', syncMode: 'symlink', targetAgents: ['.claude'] };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readJSON).mockResolvedValue(config);
    vi.mocked(fs.readdir).mockResolvedValue(['skill1.ts'] as any);
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);

    await unpackCommand();

    expect(fs.remove).toHaveBeenCalled();
    expect(fs.ensureSymlink).toHaveBeenCalledWith(
      '../../skills/skill1.ts',
      path.join(MOCK_ROOT_DIR, '.claude', 'skills', 'skill1.ts'),
      'file',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Synced to .claude/skills');
  });

  it('should create agent and skills directories if they do not exist', async () => {
    const config = { sourceDir: './skills', syncMode: 'copy', targetAgents: ['.new-agent'] };
    vi.mocked(fs.existsSync).mockImplementation(((p: string) => {
      if (p.endsWith('agentsy.json')) return true;
      if (p.endsWith('skills')) return true;
      return false;
    }) as any);
    vi.mocked(fs.readJSON).mockResolvedValue(config);
    vi.mocked(fs.readdir).mockResolvedValue(['skill1.ts'] as any);

    await unpackCommand();

    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(MOCK_ROOT_DIR, '.new-agent'));
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(MOCK_ROOT_DIR, '.new-agent', 'skills'));
  });

  it('should remove existing file before copying', async () => {
    const config = { sourceDir: './skills', syncMode: 'copy', targetAgents: ['.gemini'] };
    vi.mocked(fs.existsSync).mockReturnValue(true); // Simulate all files exist
    vi.mocked(fs.readJSON).mockResolvedValue(config);
    vi.mocked(fs.readdir).mockResolvedValue(['skill1.ts'] as any);

    await unpackCommand();

    expect(fs.remove).toHaveBeenCalledWith(
      path.join(MOCK_ROOT_DIR, '.gemini', 'skills', 'skill1.ts'),
    );
    expect(fs.copy).toHaveBeenCalled();
  });

  it('should remove existing symlink before creating a new one', async () => {
    const config = { sourceDir: './skills', syncMode: 'symlink', targetAgents: ['.claude'] };
    vi.mocked(fs.existsSync).mockImplementation(((p: string) => {
      if (p.endsWith('skill1.ts')) return false;
      return true;
    }) as any);
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);
    vi.mocked(fs.readJSON).mockResolvedValue(config);
    vi.mocked(fs.readdir).mockResolvedValue(['skill1.ts'] as any);

    await unpackCommand();

    expect(fs.remove).toHaveBeenCalled();
    expect(fs.ensureSymlink).toHaveBeenCalled();
  });
});
