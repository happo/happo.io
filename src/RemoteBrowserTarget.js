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
    { apiKey, apiSecret, maxTries: 5 },
  );
  if (status === 'done') {
    return result.map((i) => Object.assign({}, i, { snapRequestId: requestId }));
  }
  await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  return waitFor({ requestId, endpoint, apiKey, apiSecret });
}

const MIN_INTERNET_EXPLORER_WIDTH = 400;

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport, chunks = 1, maxHeight, renderingOptions }) {
    const viewportMatch = viewport.match(VIEWPORT_PATTERN);
    if (!viewportMatch) {
      throw new Error(
        `Invalid viewport "${viewport}". Here's an example of a valid one: "1024x768".`,
      );
    }

    const [_, width] = viewportMatch; // eslint-disable-line no-unused-vars

    if (browserName === 'edge' && width < MIN_INTERNET_EXPLORER_WIDTH) {
      throw new Error(
        `Invalid viewport width for the "edge" target (you provided ${width}). Smallest width it can handle is ${MIN_INTERNET_EXPLORER_WIDTH}.`,
      );
    }

    this.chunks = chunks;
    this.browserName = browserName;
    this.viewport = viewport;
    this.maxHeight = maxHeight;
    this.renderingOptions = renderingOptions;
  }

  async execute({
    globalCSS,
    assetsPackage,
    staticPackage,
    snapPayloads,
    apiKey,
    apiSecret,
    endpoint,
    pages,
  }) {
    const boundMakeRequest = async ({ slice, chunk, pageSlice }) =>
      makeRequest(
        {
          url: `${endpoint}/api/snap-requests`,
          method: 'POST',
          json: true,
          body: {
            type: `browser-${this.browserName}`,
            payload: {
              viewport: this.viewport,
              maxHeight: this.maxHeight,
              renderingOptions: this.renderingOptions,
              globalCSS,
              snapPayloads: slice,
              chunk,
              staticPackage,
              assetsPackage,
              pages: pageSlice,
            },
          },
        },
        { apiKey, apiSecret, maxTries: 5 },
      );
    const promises = [];
    if (staticPackage) {
      for (let i = 0; i < this.chunks; i += 1) {
        // We allow one `await` inside the loop here to avoid POSTing all payloads
        // to the server at the same time (thus reducing load a little).
        // eslint-disable-next-line no-await-in-loop
        const { requestId } = await boundMakeRequest({
          chunk: { index: i, total: this.chunks },
        });
        promises.push(waitFor({ requestId, endpoint, apiKey, apiSecret }));
      }
    } else if (pages) {
      const pagesPerChunk = Math.ceil(pages.length / this.chunks);
      for (let i = 0; i < this.chunks; i += 1) {
        const pageSlice = pages.slice(
          i * pagesPerChunk,
          i * pagesPerChunk + pagesPerChunk,
        );
        // We allow one `await` inside the loop here to avoid POSTing all payloads
        // to the server at the same time (thus reducing load a little).
        // eslint-disable-next-line no-await-in-loop
        const { requestId } = await boundMakeRequest({ pageSlice });
        promises.push(waitFor({ requestId, endpoint, apiKey, apiSecret }));
      }
    } else {
      const snapsPerChunk = Math.ceil(snapPayloads.length / this.chunks);
      for (let i = 0; i < this.chunks; i += 1) {
        const slice = snapPayloads.slice(
          i * snapsPerChunk,
          i * snapsPerChunk + snapsPerChunk,
        );
        // We allow one `await` inside the loop here to avoid POSTing all payloads
        // to the server at the same time (thus reducing load a little).
        // eslint-disable-next-line no-await-in-loop
        const { requestId } = await boundMakeRequest({ slice });
        promises.push(waitFor({ requestId, endpoint, apiKey, apiSecret }));
      }
    }

    const result = [];
    (await Promise.all(promises)).forEach((list) => {
      result.push(...list);
    });

    return result;
  }
}
