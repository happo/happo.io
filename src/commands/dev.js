import crypto from 'crypto';

import compareReportsCommand from './compareReports';
import uploadReport from '../uploadReport';

export default async function devCommand(config, { only }) {
  const {
    apiKey,
    apiSecret,
    endpoint,
    hooks: {
      run,
    },
  } = config;
  let previousSha;
  run(config, {
    only,
    onReady: async (snaps) => {
      const sha = `dev-${crypto.randomBytes(10).toString('hex')}`;
      console.log(`Preparing report (${sha})...`);
      const { url } = await uploadReport({
        snaps,
        sha,
        endpoint,
        apiKey,
        apiSecret,
      });
      console.log(`View results at ${url}`);

      if (previousSha) {
        console.log('Comparing with previous run...')
        const result = await compareReportsCommand(
          previousSha,
          sha,
          { apiKey, apiSecret, endpoint },
          {}
        );
        console.log(result.summary);
      }
      previousSha = sha;
    },
    onBuilding: () => {
      console.log('Building...');
    }
  });
}
