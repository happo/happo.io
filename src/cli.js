#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import { configFile } from './DEFAULTS';
import hasReportCommand from './commands/hasReport';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import compareReportsCommand from './commands/compareReports';
import runCommand from './commands/run';
import getSha from './getSha';

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'set config path', configFile)
  .usage('[options]');

commander
  .command('run [sha]')
  .description('execute a full happo run')
  .action(async (sha) => {
    const usedSha = sha || await getSha();
    await runCommand(usedSha, loadUserConfig(commander.config));
  });

commander
  .command('has-report <sha>')
  .description('check if there is a report for a specific sha')
  .action(async (sha) => {
    if (await hasReportCommand(sha, loadUserConfig(commander.config))) {
      process.exit(0);
    } else {
      process.exit(1);
    };
  });

commander
  .command('compare <sha1> <sha2>')
  .description('compare reports for two different shas')
  .action(async (sha1, sha2) => {
    const result = await compareReportsCommand(sha1, sha2,
      loadUserConfig(commander.config));
    console.log(result.summary);
    if (result.equal) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

if (!process.argv.slice(2).length) {
  commander.help();
}

commander.parse(process.argv);
