import makeRequest from '../makeRequest';

export default function compareReports(
  sha1,
  sha2,
  { apiKey, apiSecret, endpoint, project },
  { link, message, author },
) {
  return makeRequest(
    {
      url: `${endpoint}/api/reports/${sha1}/compare/${sha2}`,
      method: 'POST',
      json: true,
      body: {
        link,
        message,
        author,
        project,
      },
    },
    { apiKey, apiSecret, maxTries: 2 },
  );
}
