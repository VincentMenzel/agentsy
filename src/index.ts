#!/usr/bin/env node
import { Command } from 'commander';

import { initCommand } from './commands/init.js';
import { unpackCommand } from './commands/unpack.js';

const program = new Command();

program
  .name('agentsy')
  .description('Manage and unpack agent skills across multiple configurations')
  .version('1.0.0');

program.command('init').description('Guided setup for agentsy configuration').action(initCommand);

program
  .command('unpack')
  .description('Unpack skills from the source directory into agent configurations')
  .action(unpackCommand);

program.parse();
