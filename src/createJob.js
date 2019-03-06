import makeRequest from './makeRequest';

export default function createJob({
  sha,
  beforeSha,
  requestIds,
  endpoint,
  apiKey,
  apiSecret,
  link,
  message,
  project,
}) {
  return makeRequest(
    {
      url: `${endpoint}/api/jobs`,
      method: 'POST',
      json: true,
      body: {
        sha,
        beforeSha,
        requestIds,
        link,
        message,
        project,
      },
    },
    { apiKey, apiSecret, maxTries: 2 },
  );
}
