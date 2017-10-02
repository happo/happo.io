import makeRequest from './makeRequest';

export default function uploadReport({
  snaps,
  sha,
  endpoint,
  apiKey,
  apiSecret,
}) {
  return makeRequest({
    url: `${endpoint}/api/reports/${sha}`,
    method: 'POST',
    json: true,
    body: {
      snaps,
    },
  }, { apiKey, apiSecret });
}
