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
      await uploadReport({
        snaps,
        sha,
        endpoint,
        apiKey,
        apiSecret,
      });
      console.log(`View results at ${endpoint}/report?q=${sha}`);

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
