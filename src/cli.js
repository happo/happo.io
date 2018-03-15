#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import { configFile } from './DEFAULTS';
import hasReportCommand from './commands/hasReport';
import generateDevSha from './generateDevSha';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import compareReportsCommand from './commands/compareReports';
import runCommand from './commands/run';
import devCommand from './commands/dev';

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'set config path', configFile)
  .option('-o, --only <component>', 'limit to one component')
  .option('-l, --link <url>', 'provide a link back to the commit')
  .option('-m, --message <message>', 'associate the run with a message (e.g. commit subject)')
  .option('-a, --author <email>', 'the author of the commit')
  .usage('[options]');

commander
  .command('run [sha]')
  .description('execute a full happo run')
  .action(async (sha) => {
    let usedSha = sha || generateDevSha();
    if (!sha) {
      console.log(`No [sha] provided. A temporary one will be used in place: "${usedSha}".`);
    }
    if (commander.only) {
      usedSha = usedSha + '-' + commander.only;
    }
    await runCommand(usedSha, loadUserConfig(commander.config), {
      only: commander.only,
      link: commander.link,
      message: commander.message,
    });
  });

commander
  .command('dev')
  .description('start dev mode')
  .action(async (sha) => {
    await devCommand(loadUserConfig(commander.config), {
      only: commander.only,
    });
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
    const result = await compareReportsCommand(
      sha1,
      sha2,
      loadUserConfig(commander.config),
      {
        link: commander.link,
        message: commander.message,
        author: commander.author,
      }
    );
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

process.on('unhandledRejection', error => {
  console.error(error.stack);
  process.exit(1);
});

commander.parse(process.argv);
