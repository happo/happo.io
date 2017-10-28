import uploadReport from '../uploadReport';

export default async function runCommand(sha, config, { only, link, message }) {
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
  const { url } = await uploadReport({
    snaps,
    sha,
    endpoint,
    apiKey,
    apiSecret,
    link,
    message,
  });
  console.log(`View results at ${url}`);
  console.log(`Done ${sha}`);
}
