import makeRequest from './makeRequest';

export default function fetchReport({ sha, endpoint, apiKey, apiSecret }) {
  return makeRequest(
    {
      url: `${endpoint}/api/reports/${sha}`,
      method: 'GET',
      json: true,
    },
    { apiKey, apiSecret },
  );
}
