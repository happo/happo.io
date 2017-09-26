import { viewerEndpoint } from './DEFAULTS';
import makeRequest from './makeRequest';

export default function fetchReport({
  snaps,
  sha,
  endpoint = viewerEndpoint,
  apiKey,
  apiSecret,
}) {
  return makeRequest({
    url: `${endpoint}/api/reports/${sha}`,
    method: 'GET',
    json: true,
  }, { apiKey, apiSecret });
}
