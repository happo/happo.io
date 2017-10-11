import uploadReport from '../uploadReport';

export default async function runCommand(sha, config, { only }) {
  const {
    apiKey,
    apiSecret,
    endpoint,
    hooks: {
      run,
    },
  } = config;
  const snaps = await run(config, { only });
  console.log(`Uploading report for ${sha}...`);
  await uploadReport({
    snaps,
    sha,
    endpoint,
    apiKey,
    apiSecret,
  });
  console.log(`View results at ${endpoint}/report?q=${sha}`);
  console.log(`Done ${sha}`);
}
