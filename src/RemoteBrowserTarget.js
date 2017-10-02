import makeRequest from './makeRequest';

const POLL_INTERVAL = 5000; // 5 secs

function waitFor({ requestId, endpoint, apiKey, apiSecret }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      makeRequest({
        url: `${endpoint}/api/snap-requests/${requestId}`,
        method: 'GET',
        json: true,
      }, { apiKey, apiSecret }).then(({ status, result }) => {
        if (status === 'done') {
          resolve(result);
        } else {
          waitFor({ requestId, endpoint, apiKey, apiSecret })
            .then(resolve)
            .catch(reject);
        }
      }).catch(reject);
    }, POLL_INTERVAL);
  });
}

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport }) {
    this.browserName = browserName;
    this.viewport = viewport;
  }

  execute({ globalCSS, snapPayloads, apiKey, apiSecret, endpoint }) {
    return makeRequest({
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
      }
    }, { apiKey, apiSecret }).then(({ requestId }) => {
      console.log(`Waiting for ${this.browserName} results (ID=${requestId})...`);
      return waitFor({ requestId, endpoint, apiKey, apiSecret });
    });
  }
}
