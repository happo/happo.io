import request from 'request-promise-native';

export default function uploadReport({ snaps, sha, endpoint }) {
  return request.post({
    url: `${endpoint}/api/reports/${sha}`,
    method: 'POST',
    json: true,
    body: {
      snaps,
      sha,
    },
  });
}
