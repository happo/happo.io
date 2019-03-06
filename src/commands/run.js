import mkdirp from 'mkdirp';
import rimraf from 'rimraf';

import Logger from '../Logger';
import createJob from '../createJob';
import domRunner from '../domRunner';
import remoteRunner from '../remoteRunner';
import waitForJob from '../waitForJob';

export default async function runCommand(
  sha,
  config,
  { only, link, message, asynchronous, beforeSha },
) {
  const logger = new Logger();
  const { apiKey, apiSecret, endpoint, project, plugins } = config;

  rimraf.sync(config.tmpdir);
  mkdirp.sync(config.tmpdir);

  const staticPlugin = plugins.find(
    (plugin) => typeof plugin.generateStaticPackage === 'function',
  );
  const requestIds = staticPlugin
    ? await remoteRunner(config, staticPlugin)
    : await domRunner(config, { only });

  const { url, id } = await createJob({
    beforeSha,
    requestIds,
    sha,
    endpoint,
    apiKey,
    apiSecret,
    link,
    message,
    project,
  });
  if (asynchronous) {
    logger.start(`Job for ${sha} started. Follow progress at ${url}`);
  } else {
    const { url: reportUrl } = await waitForJob({ id, endpoint, apiKey, apiSecret });
    logger.info(`View results at ${reportUrl}`);
    logger.info(`Done ${sha}`);
  }
}
