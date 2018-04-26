import domRunner from '../domRunner';
import uploadReport from '../uploadReport';

export default async function runCommand(sha, config, { only, link, message }) {
  const { apiKey, apiSecret, endpoint } = config;
  const snaps = await domRunner(config, { only });
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
