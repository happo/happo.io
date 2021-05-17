import commander from 'commander';

import { configFile } from './DEFAULTS';
import Logger from './Logger';
import compareReportsCommand from './commands/compareReports';
import devCommand from './commands/dev';
import generateDevSha from './generateDevSha';
import hasReportCommand from './commands/hasReport';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import debugCommand from './commands/debug';
import runCommand from './commands/run';
import startJobCommand from './commands/startJob';
import postGithubComment from './postGithubComment';
import uploadReport from './uploadReport';

const {
  HAPPO_NOTIFY,
  HAPPO_IS_ASYNC: RAW_HAPPO_IS_ASYNC,
  HAPPO_FALLBACK_SHAS,
} = process.env;
const HAPPO_IS_ASYNC = RAW_HAPPO_IS_ASYNC === 'true';

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'set config path', configFile)
  .option('-o, --only <component>', 'limit to one component')
  .option('-l, --link <url>', 'provide a link back to the commit')
  .option('-a, --async', 'process reports/comparisons asynchronously')
  .option(
    '--fallbackShas',
    'comma-separated list of fallback shas for compare calls',
  )
  .option(
    '-n, --notify <emails>',
    'one or more (comma-separated) email addresses to notify with results',
  )
  .option(
    '-m, --message <message>',
    'associate the run with a message (e.g. commit subject)',
  )
  .option('-a, --author <email>', 'the author of the commit')
  .option('--debug-port <port>', 'the port where the debug server listens')
  .option('--debug-port <port>', 'the port where the debug server listens')
  .option(
    '--dry-run',
    'makes the `happo compare` call non-destructive when running with a `compareThreshold` config option',
  )
  .usage('[options]');

commander
  .command('run [sha]')
  .description('execute a full happo run')
  .action(async (sha) => {
    let usedSha = sha || generateDevSha();
    if (!sha) {
      new Logger().info(
        `No [sha] provided. A temporary one will be used in place: "${usedSha}".`,
      );
    }
    if (commander.only) {
      usedSha = `${usedSha}-${commander.only}`;
    }
    const isAsync = commander.async || HAPPO_IS_ASYNC;
    await runCommand(usedSha, await loadUserConfig(commander.config), {
      only: commander.only,
      link: commander.link,
      isAsync,
      message: commander.message,
    });
    process.exit(0);
  });

commander
  .command('dev')
  .description('start dev mode')
  .action(async () => {
    await devCommand(await loadUserConfig(commander.config), {
      only: commander.only,
    });
  });

commander
  .command('debug')
  .description('start a local server where you can debug happo examples')
  .action(async () => {
    debugCommand(
      { port: commander.debugPort },
      await loadUserConfig(commander.config),
    );
  });

commander
  .command('has-report <sha>')
  .description('check if there is a report for a specific sha')
  .action(async (sha) => {
    if (await hasReportCommand(sha, await loadUserConfig(commander.config))) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

commander
  .command('empty <sha>')
  .description('mark a report as empty')
  .action(async (sha) => {
    await uploadReport(
      Object.assign({ snaps: [], sha }, await loadUserConfig(commander.config)),
    );
    process.exit(0);
  });

commander
  .command('compare <sha1> <sha2>')
  .description('compare reports for two different shas')
  .action(async (sha1, sha2) => {
    const config = await loadUserConfig(commander.config);
    const isAsync = commander.async || HAPPO_IS_ASYNC;
    const fallbackShas = commander.fallbackShas || HAPPO_FALLBACK_SHAS;
    const notify = commander.notify || HAPPO_NOTIFY;
    const result = await compareReportsCommand(sha1, sha2, config, {
      link: commander.link,
      message: commander.message,
      author: commander.author,
      dryRun: commander.dryRun,
      notify,
      isAsync,
      fallbackShas,
    });
    if (isAsync) {
      new Logger().info(`Async comparison created with ID=${result.id}`);
      process.exit(0);
    }
    if (commander.link && process.env.HAPPO_GITHUB_USER_CREDENTIALS) {
      await postGithubComment({
        link: commander.link,
        statusImageUrl: result.statusImageUrl,
        compareUrl: result.compareUrl,
        githubApiUrl: config.githubApiUrl,
      });
    }
    new Logger().info(result.summary);
    if (result.equal) {
      process.exit(0);
    } else {
      process.exit(113);
    }
  });

commander
  .command('start-job <sha1> <sha2>')
  .description('start a job (used by happo-ci script)')
  .action(async (sha1, sha2) => {
    const result = await startJobCommand(
      sha1,
      sha2,
      {
        link: commander.link,
        message: commander.message,
      },
      await loadUserConfig(commander.config),
    );
    new Logger().info(result.id);
  });

commander.on('command:*', (cmd) => {
  console.log(`Invalid command: "${cmd}"\n`);
  commander.outputHelp();
  process.exit(1);
});

export default function executeCli(argv) {
  if (!argv.slice(2).length) {
    commander.outputHelp();
    process.exit(1);
    return;
  }
  return commander.parse(argv);
}
