#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import { configFile, viewerEndpoint } from './DEFAULTS';
import fetchReport from './fetchReport';
import getSha from './getSha';
import loadUserConfig from './loadUserConfig';
import moveToSha from './moveToSha';
import packageJson from '../package.json';
import runForSha from './runForSha';

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'set config path', configFile)
  .option('-f, --force', 'force recreation of reports even if they already exist')
  .option('-C, --compare-against <sha>', 'set the base commit to compare with')
  .usage('[options]')
  .parse(process.argv);

(async function() {

  async function checkForPreviousReport(sha, { apiKey, apiSecret, viewerEndpoint }) {
    try {
      console.log(`Checking for previous report for ${sha}...`);
      const existingReport = await fetchReport({
        sha,
        apiKey,
        apiSecret,
        endpoint: viewerEndpoint,
      });
      console.log('Found one that we can reuse ' +
        '(use `--force` to force-generate a new report)');
      return existingReport;
    } catch (e) {
      console.log('None found.');
    }
  }

  const config = loadUserConfig(commander.config);
  const previousSha = commander.compareAgainst;
  let previousReport;
  if (previousSha) {
    if (!commander.force) {
      const { apiKey, apiSecret, viewerEndpoint } = config;
      previousReport = await
        checkForPreviousReport(previousSha, { apiKey, apiSecret, viewerEndpoint });
    }
    if (!previousReport) {
      const { fullSha, cleanup } = await moveToSha(previousSha, {
        force: commander.force,
      });
      try {
        previousReport = await runForSha(previousSha, { config, force: commander.force });
      } catch (e) {
        await cleanup();
        throw new Error(e);
      }
      await cleanup();
    }
  }
  const sha = await getSha();
  await runForSha(sha, { config });

  if (previousSha) {
    console.log(`${viewerEndpoint}/compare?q=${previousSha}..${sha}`);
  }
})();
