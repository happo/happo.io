import request from 'request-promise-native';
import jwt from 'jsonwebtoken';

export default function uploadReport({ snaps, sha, endpoint, apiKey, apiSecret }) {
  const signed = jwt.sign({ key: apiKey }, apiSecret, { header: { kid: apiKey } });
  return request.post({
    auth: {
      bearer: signed,
    },
    url: `${endpoint}/api/reports/${sha}`,
    method: 'POST',
    json: true,
    body: {
      snaps,
      sha,
    },
  });
}
