import makeRequest from './makeRequest';

const POLL_INTERVAL = 5000; // 5 secs

async function waitFor({ requestId, endpoint, apiKey, apiSecret }) {
  const { status, result } = await makeRequest(
    {
      url: `${endpoint}/api/snap-requests/${requestId}`,
      method: 'GET',
      json: true,
    },
    { apiKey, apiSecret },
  );
  if (status === 'done') {
    return result;
  }
  await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  return waitFor({ requestId, endpoint, apiKey, apiSecret });
}

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport }) {
    this.browserName = browserName;
    this.viewport = viewport;
  }

  async execute({ globalCSS, snapPayloads, apiKey, apiSecret, endpoint }) {
    const { requestId } = await makeRequest(
      {
        url: `${endpoint}/api/snap-requests`,
        method: 'POST',
        json: true,
        body: {
          type: `browser-${this.browserName}`,
          payload: {
            viewport: this.viewport,
            globalCSS,
            snapPayloads,
          },
        },
      },
      { apiKey, apiSecret },
    );
    return waitFor({ requestId, endpoint, apiKey, apiSecret });
  }
}
