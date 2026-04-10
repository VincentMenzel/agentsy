import * as prompts from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initCommand } from '../../src/commands/init';

vi.mock('fs-extra', () => ({
  default: {
    appendFile: vi.fn(),
    existsSync: vi.fn(),
    readFile: vi.fn(),
    writeJSON: vi.fn(),
  },
}));

vi.mock('@inquirer/prompts');

describe('initCommand', () => {
  const MOCK_ROOT_DIR = '/fake/dir';
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'cwd').mockReturnValue(MOCK_ROOT_DIR);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create agentsy.json with user inputs', async () => {
    vi.mocked(prompts.input).mockResolvedValue('./my-skills');
    vi.mocked(prompts.select).mockResolvedValue('symlink');
    vi.mocked(prompts.checkbox).mockResolvedValue(['.gemini', '.claude']);
    fs.existsSync.mockReturnValue(false);

    await initCommand();

    expect(fs.writeJSON).toHaveBeenCalledWith(
      path.join(MOCK_ROOT_DIR, 'agentsy.json'),
      {
        sourceDir: './my-skills',
        syncMode: 'symlink',
        targetAgents: ['.gemini', '.claude'],
      },
      { spaces: 2 },
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('\n✨ Configuration saved to agentsy.json!');
  });

  it('should exit if no target agents are selected', async () => {
    vi.mocked(prompts.input).mockResolvedValue('./skills');
    vi.mocked(prompts.select).mockResolvedValue('copy');
    vi.mocked(prompts.checkbox).mockResolvedValue([]);

    await expect(initCommand()).rejects.toThrow('process.exit called');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should update .gitignore if user confirms', async () => {
    vi.mocked(prompts.input).mockResolvedValue('./skills');
    vi.mocked(prompts.select).mockResolvedValue('copy');
    vi.mocked(prompts.checkbox).mockResolvedValue(['.gemini']);
    fs.existsSync.mockImplementation((p) => p.toString().endsWith('.gitignore'));
    fs.readFile.mockResolvedValue('');
    vi.mocked(prompts.confirm).mockResolvedValue(true);

    await initCommand();

    expect(fs.appendFile).toHaveBeenCalledWith(
      path.join(MOCK_ROOT_DIR, '.gitignore'),
      `\n# Agentsy\n.gemini/`,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Updated .gitignore');
  });

  it('should not update .gitignore if user denies', async () => {
    vi.mocked(prompts.input).mockResolvedValue('./skills');
    vi.mocked(prompts.select).mockResolvedValue('copy');
    vi.mocked(prompts.checkbox).mockResolvedValue(['.gemini']);
    fs.existsSync.mockImplementation((p) => p.toString().endsWith('.gitignore'));
    fs.readFile.mockResolvedValue('');
    vi.mocked(prompts.confirm).mockResolvedValue(false);

    await initCommand();

    expect(fs.appendFile).not.toHaveBeenCalled();
  });

  it('should not prompt to update .gitignore if it already contains the agents', async () => {
    vi.mocked(prompts.input).mockResolvedValue('./skills');
    vi.mocked(prompts.select).mockResolvedValue('copy');
    vi.mocked(prompts.checkbox).mockResolvedValue(['.gemini']);
    fs.existsSync.mockImplementation((p) => p.toString().endsWith('.gitignore'));
    fs.readFile.mockResolvedValue('.gemini/');

    await initCommand();

    expect(prompts.confirm).not.toHaveBeenCalled();
  });
});
