import Logger from '../Logger';
import domRunner from '../domRunner';
import uploadReport from '../uploadReport';

export default async function runCommand(sha, config, { only, link, message }) {
  const logger = new Logger();
  const { apiKey, apiSecret, endpoint, project } = config;
  const snaps = await domRunner(config, { only });
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
