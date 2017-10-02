import makeRequest from '../makeRequest';

export default async function compareReports(sha1, sha2, {
  apiKey,
  apiSecret,
  endpoint,
}) {
  return await makeRequest({
    url: `${endpoint}/api/reports/${sha1}/compare/${sha2}`,
    method: 'GET',
    json: true,
  }, { apiKey, apiSecret });
}
