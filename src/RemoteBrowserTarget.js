import request from 'request-promise-native';

export default class RemoteBrowserTarget {
  constructor(browserName, { viewport }) {
    this.browserName = browserName;
    this.viewport = viewport;
  }

  execute(snaps) {
    return request.post({
      url: 'http://localhost:4433/snap',
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
