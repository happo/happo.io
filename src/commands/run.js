import uploadReport from '../uploadReport';

export default async function runCommand(sha, config) {
  const {
    apiKey,
    apiSecret,
    endpoint,
    hooks: {
      run,
    },
  } = config;
  const snaps = await run(config);
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
