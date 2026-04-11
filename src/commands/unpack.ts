import fs from 'fs-extra';
import path from 'path';

interface AgentsyConfig {
  sourceDir: string;
  syncMode?: 'copy' | 'symlink';
  targetAgents: string[];
}

export async function unpackCommand() {
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, 'agentsy.json');

  if (!fs.existsSync(configPath)) {
    console.error('❌ Configuration file agentsy.json not found. Run `agentsy init` first.');
    process.exit(1);
  }

  const {
    sourceDir,
    syncMode = 'copy',
    targetAgents,
  } = (await fs.readJSON(configPath)) as AgentsyConfig;
  const fullSourcePath = path.resolve(rootDir, sourceDir);

  if (!fs.existsSync(fullSourcePath)) {
    console.error(`❌ Source directory not found: ${fullSourcePath}`);
    process.exit(1);
  }

  const skills = await fs.readdir(fullSourcePath);

  if (skills.length === 0) {
    console.warn('⚠️  No skills found in source directory.');
    return;
  }

  console.log(
    `\n📦 Unpacking ${skills.length.toString()} skills into ${targetAgents.length.toString()} agents using ${syncMode}...\n`,
  );

  for (const agent of targetAgents) {
    const agentSkillsPath = path.join(rootDir, agent, 'skills');

    // Ensure agent folder exists
    if (!fs.existsSync(path.join(rootDir, agent))) {
      await fs.ensureDir(path.join(rootDir, agent));
    }

    // Ensure skills folder exists within agent folder
    await fs.ensureDir(agentSkillsPath);

    for (const skill of skills) {
      const src = path.join(fullSourcePath, skill);
      const dest = path.join(agentSkillsPath, skill);

      // Clean up existing file/symlink if it exists
      if (await fs.pathExists(dest)) {
        await fs.remove(dest);
      }

      if (syncMode === 'symlink') {
        // Create a relative symlink for better portability
        const relativeSrc = path.relative(agentSkillsPath, src);
        await fs.ensureSymlink(relativeSrc, dest, 'file');
      } else {
        await fs.copy(src, dest, { overwrite: true });
      }
    }

    console.log(`✅ Synced to ${agent}/skills`);
  }

  console.log('\n✨ Done!\n');
}
