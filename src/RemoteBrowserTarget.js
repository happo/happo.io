import makeRequest from './makeRequest';

const POLL_INTERVAL = 5000; // 5 secs
const VIEWPORT_PATTERN = /^([0-9]+)x([0-9]+)$/;

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

const MIN_INTERNET_EXPLORER_WIDTH = 400;

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport }) {
    const viewportMatch = viewport.match(VIEWPORT_PATTERN);
    if (!viewportMatch) {
      throw new Error(`Invalid viewport "${viewport}". Here's an example of a valid one: "1024x768".`);
    }

    const [_, width] = viewportMatch; // eslint-disable-line no-unused-vars

    if (browserName === 'edge' && width < MIN_INTERNET_EXPLORER_WIDTH) {
      throw new Error(`Invalid viewport width for the "edge" target (you provided ${width}). Smallest width it can handle is ${MIN_INTERNET_EXPLORER_WIDTH}.`);
    }

    this.browserName = browserName;
    this.viewport = viewport;
  }

  async execute({ globalCSS, staticPackage, snapPayloads, apiKey, apiSecret, endpoint }) {
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
            staticPackage,
          },
        },
      },
      { apiKey, apiSecret },
    );
    return waitFor({ requestId, endpoint, apiKey, apiSecret });
  }
}
