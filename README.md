# agentsy 🚀

A lightweight CLI tool to manage and sync AI agent skills across multiple configurations (Gemini, Claude, Cursor, and more).

[![npm version](https://img.shields.io/npm/v/agentsy.svg)](https://www.npmjs.com/package/agentsy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why agentsy?

If you use multiple AI agents or IDE extensions (like the Gemini CLI, Claude Dev, or Cursor), you often find yourself maintaining separate "skills" or "instructions" folders for each. 

**agentsy** allows you to:
- Maintain a **single source of truth** for your skills.
- Automatically **unpack/sync** them into all your agent directories at once.
- Choose between **physical copies** or **symlinks** (ideal for development).
- Automatically manage your **.gitignore** to keep agent configs out of your repository.

## Installation

You can run agentsy directly via `npx` or install it globally:

```bash
# Run once
npx agentsy <command>

# Install globally
npm install -g agentsy
```

## Quick Start

### 1. Initialize
Run the setup wizard in the root of your project:
```bash
agentsy init
```
The wizard will guide you through:
- Locating your skills folder (e.g., `./skills`).
- Selecting target agent directories (`.gemini`, `.claude`, `.cursor`, etc.).
- Choosing a sync mode (**Copy** vs **Symlink**).
- Updating your `.gitignore`.

This creates an `agentsy.json` configuration file.

### 2. Unpack/Sync
Whenever you update your skills, run:
```bash
agentsy unpack
```
This will sync all skills from your source folder to the `skills/` subdirectory of every configured agent.

## Configuration (`agentsy.json`)

```json
{
  "sourceDir": "./my-skills",
  "syncMode": "symlink",
  "targetAgents": [
    ".gemini",
    ".claude",
    ".cursor"
  ]
}
```

## Supported Agents
By default, agentsy detects:
- `.gemini`
- `.claude`
- `.cursor`
- `.agents`
- `.shared-agents`

## License

MIT © [Vincent Menzel](https://github.com/VincentMenzel)
