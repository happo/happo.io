import makeRequest from './makeRequest';

export default function fetchReport({ sha, endpoint, apiKey, apiSecret, project }) {
  return makeRequest(
    {
      url: `${endpoint}/api/reports/${sha}${project ? `?project=${project}` : ''}`,
      method: 'GET',
      json: true,
    },
    { apiKey, apiSecret },
  );
}
