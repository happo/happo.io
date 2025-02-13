import fs from 'fs';

import Logger from '../Logger';
import compareReportsCommand from './compareReports';
import domRunner from '../domRunner';
import generateDevSha from '../generateDevSha';
import uploadReport from '../uploadReport';

function indent(str) {
  return str.replace(/^/gm, ' ');
}

export default async function devCommand(config, { only }) {
  const { apiKey, apiSecret, endpoint, project } = config;
  let baselineSha;
  const logger = new Logger();

  await fs.promises.rm(config.tmpdir, { recursive: true, force: true });
  await fs.promises.mkdir(config.tmpdir, { recursive: true });

  domRunner(config, {
    only,
    onReady: async (snaps) => {
      const sha = generateDevSha();
      logger.start(`Preparing report (${sha})...`);
      const { url } = await uploadReport({
        snaps,
        sha,
        endpoint,
        apiKey,
        apiSecret,
        project,
      });
      logger.success();
      logger.info(`View results at ${url}`);

      if (baselineSha) {
        logger.start('Comparing with baseline report...');
        const result = await compareReportsCommand(
          baselineSha,
          sha,
          { apiKey, apiSecret, endpoint, project },
          {},
        );
        logger.success();
        logger.info(`\n${indent(result.summary)}`);
      } else {
        baselineSha = sha;
      }
    },
  });
}
