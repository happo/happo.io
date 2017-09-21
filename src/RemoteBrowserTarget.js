import request from 'request-promise-native';

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport, endpoint = 'http://localhost:4433' }) {
    this.browserName = browserName;
    this.viewport = viewport;
    this.endpoint = endpoint;
  }

  execute(snaps) {
    return request.post({
      url: `${this.endpoint}/snap`,
      method: 'POST',
      json: true,
      body: {
        browserName: this.browserName,
        viewport: this.viewport,
        snaps,
      }
    });
  }
}
