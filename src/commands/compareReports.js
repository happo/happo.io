import makeRequest from '../makeRequest';

export default async function compareReports(
  sha1,
  sha2,
  { apiKey, apiSecret, endpoint },
  { link, message, author },
) {
  return await makeRequest(
    {
      url: `${endpoint}/api/reports/${sha1}/compare/${sha2}`,
      method: 'POST',
      json: true,
      body: {
        link,
        message,
        author,
      },
    },
    { apiKey, apiSecret },
  );
}
