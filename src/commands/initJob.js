import makeRequest from '../makeRequest';

export default async function initJobCommand({ sha1, sha2, link, message }, config) {
  const { apiKey, apiSecret, endpoint, project } = config;
  const { jobId } = await makeRequest(
    {
      url: `${endpoint}/api/jobs`,
      method: 'POST',
      json: true,
      body: {
        project,
        link,
        message,
        sha1,
        sha2,
      },
    },
    { apiKey, apiSecret },
  );
  return jobId;
}
