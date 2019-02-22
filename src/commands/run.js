import mkdirp from 'mkdirp';
import rimraf from 'rimraf';

import Logger from '../Logger';
import domRunner from '../domRunner';
import remoteRunner from '../remoteRunner';
import uploadReport from '../uploadReport';

export default async function runCommand(sha, config, { only, link, message, job }) {
  const logger = new Logger();
  const { apiKey, apiSecret, endpoint, project, plugins } = config;

  rimraf.sync(config.tmpdir);
  mkdirp.sync(config.tmpdir);

  const staticPlugin = plugins.find(
    (plugin) => typeof plugin.generateStaticPackage === 'function',
  );
  let snaps;
  if (staticPlugin) {
    snaps = await remoteRunner(config, Object.assign({}, staticPlugin, { job }));
  } else {
    snaps = await domRunner(config, { only, job });
  }

  if (job) {
    logger.info(`Happo job started. Follow progress at ${endpoint}/jobs/${job}`);
    return;
  }

  logger.start(`Uploading report for ${sha}...`);
  const { url } = await uploadReport({
    snaps,
    sha,
    endpoint,
    apiKey,
    apiSecret,
    link,
    message,
    project,
  });
  logger.success();
  logger.info(`View results at ${url}`);
  logger.info(`Done ${sha}`);
}
