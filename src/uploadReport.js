import makeRequest from './makeRequest';

export default function uploadReport({
  snaps,
  sha,
  endpoint,
  apiKey,
  apiSecret,
  link,
  message,
  project,
}) {
  return makeRequest(
    {
      url: `${endpoint}/api/reports/${sha}`,
      method: 'POST',
      json: true,
      body: {
        snaps,
        link,
        message,
        project,
      },
    },
    { apiKey, apiSecret, retryCount: 5 },
  );
}
