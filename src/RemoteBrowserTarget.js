import createHash from './createHash';
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
    { apiKey, apiSecret, retryCount: 5 },
  );
  if (status === 'done') {
    return result.map((i) => Object.assign({}, i, { snapRequestId: requestId }));
  }
  await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  return waitFor({ requestId, endpoint, apiKey, apiSecret });
}

const MIN_INTERNET_EXPLORER_WIDTH = 400;

function getPageSlices(pages, chunks) {
  const extendsPages = {};
  const rawPages = [];
  for (const page of pages) {
    if (page.extends) {
      extendsPages[page.extends] = extendsPages[page.extends] || [];
      extendsPages[page.extends].push(page);
    } else {
      rawPages.push(page);
    }
  }
  const result = [];
  const pagesPerChunk = Math.ceil(rawPages.length / chunks);
  for (let i = 0; i < chunks; i += 1) {
    const pageSlice = rawPages.slice(
      i * pagesPerChunk,
      i * pagesPerChunk + pagesPerChunk,
    );
    if (pageSlice.length > 0) {
      result.push(pageSlice);
    }
  }

  for (const sha of Object.keys(extendsPages)) {
    extendsPages[sha].extendsSha = sha;
    result.push(extendsPages[sha]);
  }
  return result;
}

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport, chunks = 1, maxHeight, ...otherOptions }) {
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
    this.otherOptions = otherOptions;
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
    asyncResults = false,
    targetName,
  }) {
    const boundMakeRequest = async ({ slice, chunk, pageSlice }) => {
      const payloadString = JSON.stringify({
        viewport: this.viewport,
        maxHeight: this.maxHeight,
        ...this.otherOptions,
        globalCSS,
        snapPayloads: slice,
        chunk,
        staticPackage,
        assetsPackage,
        pages: pageSlice,
        extendsSha: pageSlice ? pageSlice.extendsSha : undefined,
      });
      const payloadHash = createHash(
        payloadString + (pageSlice ? Math.random() : ''),
      );
      const formData = {
        type:
          pageSlice && pageSlice.extendsSha
            ? 'extends-report'
            : `browser-${this.browserName}`,
        targetName,
        payloadHash,
        payload: {
          options: {
            filename: 'payload.json',
            contentType: 'application/json',
          },
          value: payloadString,
        },
      };
      if (pageSlice && pageSlice.extendsSha) {
        formData.extendsSha = pageSlice.extendsSha;
      }
      return makeRequest(
        {
          url: `${endpoint}/api/snap-requests`,
          method: 'POST',
          json: true,
          formData,
        },
        { apiKey, apiSecret, retryCount: 5 },
      );
    };
    const promises = [];
    const requestIds = [];
    if (staticPackage) {
      for (let i = 0; i < this.chunks; i += 1) {
        // We allow one `await` inside the loop here to avoid POSTing all payloads
        // to the server at the same time (thus reducing load a little).
        // eslint-disable-next-line no-await-in-loop
        const { requestId } = await boundMakeRequest({
          chunk: { index: i, total: this.chunks },
        });
        if (asyncResults) {
          requestIds.push(requestId);
        } else {
          promises.push(waitFor({ requestId, endpoint, apiKey, apiSecret }));
        }
      }
    } else if (pages) {
      for (const pageSlice of getPageSlices(pages, this.chunks)) {
        // We allow one `await` inside the loop here to avoid POSTing all payloads
        // to the server at the same time (thus reducing load a little).
        // eslint-disable-next-line no-await-in-loop
        const { requestId } = await boundMakeRequest({ pageSlice });
        if (asyncResults) {
          requestIds.push(requestId);
        } else {
          promises.push(waitFor({ requestId, endpoint, apiKey, apiSecret }));
        }
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
        if (asyncResults) {
          requestIds.push(requestId);
        } else {
          promises.push(waitFor({ requestId, endpoint, apiKey, apiSecret }));
        }
      }
    }

    if (asyncResults) {
      return requestIds;
    }

    const result = [];
    (await Promise.all(promises)).forEach((list) => {
      result.push(...list);
    });

    return result;
  }
}
