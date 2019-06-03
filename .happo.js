const RemoteBrowserTarget = require('./build/RemoteBrowserTarget').default;

module.exports = {
  pages: [
    { url: 'https://beteendelabbet.se/', title: 'Beteendelabbet' },
  ],
  targets: {
    'chrome-large': new RemoteBrowserTarget('chrome', {
      viewport: '800x600',
      chunks: 2,
      maxHeight: 10000,
    }),
  },
};
