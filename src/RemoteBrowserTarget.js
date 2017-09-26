import { snapEndpoint } from './DEFAULTS';
import makeRequest from './makeRequest';

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport, endpoint = snapEndpoint }) {
    this.browserName = browserName;
    this.viewport = viewport;
    this.endpoint = endpoint;
  }

  execute({ snaps, apiKey, apiSecret }) {
    return makeRequest({
      url: `${this.endpoint}/api/say-cheese`,
      method: 'POST',
      json: true,
      body: {
        browserName: this.browserName,
        viewport: this.viewport,
        snaps,
      }
    }, { apiKey, apiSecret });
  }
}
