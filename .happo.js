module.exports = {
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,
  pages: [{ url: 'https://beteendelabbet.se/', title: 'Beteendelabbet' }],
  targets: {
    'chrome-large': {
      browserType: 'chrome',
      viewport: '800x600',
      chunks: 2,
      maxHeight: 10000,
    },
  },
};
