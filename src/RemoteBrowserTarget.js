import makeRequest from './makeRequest';

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport, endpoint = 'https://happo-snap.now.sh' }) {
    //constructor(browserName, { viewport, endpoint = 'http://localhost:4433' }) {
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
