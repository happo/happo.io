module.exports = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'plain',
        targets: {
          foo: {},
        },
        apiKey: 'tom',
        apiSecret: 'dooner',
      });
    }, 10);
  });
};