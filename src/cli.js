#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import { configFile, viewerEndpoint } from './DEFAULTS';
import { getPreviousSha, setPreviousSha } from './previousSha';
import getSha from './getSha';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import runForSha from './runForSha';

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'set config path', configFile)
  .usage('[options]')
  .parse(process.argv);

(async function() {
  const config = loadUserConfig(commander.config);
  const sha = await getSha();
  await runForSha(sha, { config });

  const previousSha = getPreviousSha();

  if (previousSha) {
    console.log(`${config.viewerEndpoint}/compare?q=${previousSha}..${sha}`);
  } else {
    console.log('No previous report found');
  }
  setPreviousSha(sha);
})();
