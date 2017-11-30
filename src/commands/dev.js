import compareReportsCommand from './compareReports';
import generateDevSha from '../generateDevSha';
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
  let baselineSha;
  run(config, {
    only,
    onReady: async (snaps) => {
      const sha = generateDevSha();
      console.log(`Preparing report (${sha})...`);
      const { url } = await uploadReport({
        snaps,
        sha,
        endpoint,
        apiKey,
        apiSecret,
      });
      console.log(`View results at ${url}`);

      if (baselineSha) {
        console.log('Comparing with baseline report...')
        const result = await compareReportsCommand(
          baselineSha,
          sha,
          { apiKey, apiSecret, endpoint },
          {}
        );
        console.log(result.summary);
      } else {
        baselineSha = sha;
      }
    },
    onBuilding: () => {
      console.log('Building...');
    }
  });
}
