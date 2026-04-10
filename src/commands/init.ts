import fs from 'fs-extra';
import path from 'path';
import { input, checkbox, confirm, select } from '@inquirer/prompts';
import { DEFAULT_AGENT_FOLDERS } from '../constants.js';

export async function initCommand() {
  console.log('\n🚀 Welcome to the agentsy setup wizard!\n');

  // 1. Source Directory
  const sourceDir = await input({
    message: 'Where are your skills located?',
    default: './skills',
  });

  // 2. Sync Mode
  const syncMode = await select({
    message: 'How should skills be synced?',
    choices: [
      {
        name: 'Copy (Physically duplicate files)',
        value: 'copy',
      },
      {
        name: 'Symlink (Create references to source files)',
        value: 'symlink',
      },
    ],
  });

  // 3. Scan for Agent Folders
  const rootDir = process.cwd();
  const existingAgents = DEFAULT_AGENT_FOLDERS.filter(folder =>
    fs.existsSync(path.join(rootDir, folder))
  );

  const targetAgents = await checkbox({
    message: 'Which agent directories should we unpack into?',
    choices: DEFAULT_AGENT_FOLDERS.map(folder => ({
      name: folder,
      value: folder,
      checked: existingAgents.includes(folder),
    })),
  });

  if (targetAgents.length === 0) {
    console.error('❌ You must select at least one agent directory.');
    process.exit(1);
  }

  // 3. .gitignore Check
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    const missingInGitignore = targetAgents.filter(
      agent => !gitignoreContent.includes(agent)
    );

    if (missingInGitignore.length > 0) {
      console.log(`\n⚠️  The following agent directories are not in your .gitignore: ${missingInGitignore.join(', ')}`);
      const shouldUpdate = await confirm({
        message: 'Should I automatically add them to your .gitignore?',
        default: true,
      });

      if (shouldUpdate) {
        const newLines = missingInGitignore.map(agent => `\n# Agentsy\n${agent}/`).join('\n');
        await fs.appendFile(gitignorePath, newLines);
        console.log('✅ Updated .gitignore');
      }
    }
  }

  // 5. Save Configuration
  const config = {
    sourceDir,
    syncMode,
    targetAgents,
  };

  await fs.writeJSON(path.join(rootDir, 'agentsy.json'), config, { spaces: 2 });
  console.log('\n✨ Configuration saved to agentsy.json!');
  console.log('👉 Run `agentsy unpack` to sync your skills.\n');
}
