import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unpackCommand } from '../../src/commands/unpack';
import fs from 'fs-extra';
import path from 'path';

vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(),
    readJSON: vi.fn(),
    readdir: vi.fn(),
    ensureDir: vi.fn(),
    remove: vi.fn(),
    ensureSymlink: vi.fn(),
    copy: vi.fn(),
    pathExists: vi.fn(),
  }
}));

describe('unpackCommand', () => {
  const MOCK_ROOT_DIR = '/fake/dir';
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;
  let processExitSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'cwd').mockReturnValue(MOCK_ROOT_DIR);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should exit if config file not found', async () => {
    fs.existsSync.mockReturnValue(false);
    await expect(unpackCommand()).rejects.toThrow('process.exit called');
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Configuration file agentsy.json not found. Run `agentsy init` first.');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit if source directory not found', async () => {
    fs.existsSync.mockImplementation((p) => p.toString().endsWith('agentsy.json'));
    fs.readJSON.mockResolvedValue({ sourceDir: './non-existent-skills' });

    await expect(unpackCommand()).rejects.toThrow('process.exit called');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Source directory not found:'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should warn if no skills are found', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readJSON.mockResolvedValue({ sourceDir: './skills', targetAgents: ['.gemini'] });
    fs.readdir.mockResolvedValue([]);

    await unpackCommand();
    expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️  No skills found in source directory.');
  });

  it('should copy skills to target agents', async () => {
    const config = { sourceDir: './skills', syncMode: 'copy', targetAgents: ['.gemini'] };
    fs.existsSync.mockReturnValue(true);
    fs.readJSON.mockResolvedValue(config);
    fs.readdir.mockResolvedValue(['skill1.ts', 'skill2.ts']);

    await unpackCommand();

    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(MOCK_ROOT_DIR, '.gemini', 'skills'));
    expect(fs.copy).toHaveBeenCalledTimes(2);
    expect(fs.copy).toHaveBeenCalledWith(
      path.join(MOCK_ROOT_DIR, 'skills', 'skill1.ts'),
      path.join(MOCK_ROOT_DIR, '.gemini', 'skills', 'skill1.ts'),
      { overwrite: true }
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Synced to .gemini/skills');
  });

  it('should symlink skills to target agents', async () => {
    const config = { sourceDir: './skills', syncMode: 'symlink', targetAgents: ['.claude'] };
    fs.existsSync.mockReturnValue(true);
    fs.readJSON.mockResolvedValue(config);
    fs.readdir.mockResolvedValue(['skill1.ts']);
    fs.pathExists.mockResolvedValue(true);


    await unpackCommand();

    expect(fs.remove).toHaveBeenCalled();
    expect(fs.ensureSymlink).toHaveBeenCalledWith(
      path.join(MOCK_ROOT_DIR, 'skills', 'skill1.ts'),
      path.join(MOCK_ROOT_DIR, '.claude', 'skills', 'skill1.ts'),
      'file'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Synced to .claude/skills');
  });

  it('should create agent and skills directories if they do not exist', async () => {
    const config = { sourceDir: './skills', syncMode: 'copy', targetAgents: ['.new-agent'] };
    fs.existsSync.mockImplementation((p) => {
      if (p.toString().endsWith('agentsy.json')) return true;
      if (p.toString().endsWith('skills')) return true;
      return false;
    });
    fs.readJSON.mockResolvedValue(config);
    fs.readdir.mockResolvedValue(['skill1.ts']);

    await unpackCommand();

    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(MOCK_ROOT_DIR, '.new-agent'));
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(MOCK_ROOT_DIR, '.new-agent', 'skills'));
  });

  it('should remove existing file before copying', async () => {
    const config = { sourceDir: './skills', syncMode: 'copy', targetAgents: ['.gemini'] };
    fs.existsSync.mockReturnValue(true); // Simulate all files exist
    fs.readJSON.mockResolvedValue(config);
    fs.readdir.mockResolvedValue(['skill1.ts']);

    await unpackCommand();

    expect(fs.remove).toHaveBeenCalledWith(path.join(MOCK_ROOT_DIR, '.gemini', 'skills', 'skill1.ts'));
    expect(fs.copy).toHaveBeenCalled();
  });

  it('should remove existing symlink before creating a new one', async () => {
    const config = { sourceDir: './skills', syncMode: 'symlink', targetAgents: ['.claude'] };
    fs.existsSync.mockImplementation((p) => {
        if (p.endsWith('skill1.ts')) return false;
        return true;
    });
    fs.pathExists.mockResolvedValue(true);
    fs.readJSON.mockResolvedValue(config);
    fs.readdir.mockResolvedValue(['skill1.ts']);

    await unpackCommand();

    expect(fs.remove).toHaveBeenCalled();
    expect(fs.ensureSymlink).toHaveBeenCalled();
  });
});