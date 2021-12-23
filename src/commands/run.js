import fs from 'fs';
import rimraf from 'rimraf';

import Logger, { logTag } from '../Logger';
import domRunner from '../domRunner';
import makeRequest from '../makeRequest';
import pageRunner from '../pageRunner';
import remoteRunner from '../remoteRunner';
import uploadReport from '../uploadReport';

function getStaticPlugin(plugins, config) {
  const staticPlugin = plugins.find(
    (plugin) => typeof plugin.generateStaticPackage === 'function',
  );

  if (staticPlugin) {
    return staticPlugin;
  }

  if (config.generateStaticPackage) {
    return { generateStaticPackage: config.generateStaticPackage };
  }

  return null;
}

export default async function runCommand(
  sha,
  config,
  { only, link, message, isAsync },
) {
  const logger = new Logger();
  const { apiKey, apiSecret, endpoint, project, plugins, pages } = config;

  rimraf.sync(config.tmpdir);
  fs.mkdirSync(config.tmpdir, { recursive: true });

  const staticPlugin = getStaticPlugin(plugins, config);
  let result;
  if (pages) {
    result = await pageRunner(config, { isAsync });
  } else if (staticPlugin) {
    result = await remoteRunner(config, staticPlugin, { isAsync });
  } else {
    result = await domRunner(config, { only, isAsync });
  }

  if (isAsync) {
    logger.start(`${logTag(project)}Creating async report for ${sha}...`);
    const allRequestIds = [];
    result.forEach((item) => allRequestIds.push(...item.result));
    const { id } = await makeRequest(
      {
        url: `${endpoint}/api/async-reports/${sha}`,
        method: 'POST',
        json: true,
        body: {
          requestIds: allRequestIds,
          link,
          message,
          project,
        },
      },
      { endpoint, apiKey, apiSecret, retryCount: 3 },
    );

    logger.success();
    logger.info(`${logTag(project)}Async report id: ${id}`);
  } else {
    logger.start(`${logTag(project)}Uploading report for ${sha}...`);
    const { url } = await uploadReport({
      snaps: result,
      sha,
      endpoint,
      apiKey,
      apiSecret,
      link,
      message,
      project,
    });
    logger.success();
    logger.info(`${logTag(project)}View results at ${url}`);
  }
  logger.info(`${logTag(project)}Done ${sha}`);
}
