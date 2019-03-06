import makeRequest from './makeRequest';

const POLL_INTERVAL = 5000; // 5 secs

export default async function waitForJob({ id, endpoint, apiKey, apiSecret }) {
  const { status } = await makeRequest(
    {
      url: `${endpoint}/api/jobs/${id}`,
      method: 'GET',
      json: true,
    },
    { apiKey, apiSecret, maxTries: 3 },
  );
  if (status === 'done') {
    return;
  }
  await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  return waitForJob({ id, endpoint, apiKey, apiSecret });
}
