const { RemoteBrowserTarget } = require('../../src');

const babelLoader = require.resolve('babel-loader');

module.exports = {
  apiKey: 'foo',
  apiSecret: 'bar',
  targets: {
    'chrome': new RemoteBrowserTarget('chrome', {
      viewport: '320x640',
    }),
  },

  stylesheets: [
    'http://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css',
  ],

  type: 'react',
}
