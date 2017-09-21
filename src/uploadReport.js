import request from 'request-promise-native';

export default function uploadReport({ report, sha, previousSha, endpoint }) {
  return request.post({
    url: `${endpoint}/reports`,
    method: 'POST',
    json: true,
    body: {
      report,
      sha,
      previousSha,
    },
  });
}
