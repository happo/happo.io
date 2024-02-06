window.happo = window.happo || {};

window.happo.nextExample = () => {
  if (!window.happoProcessor.next()) {
    return Promise.resolve(undefined);
  }
  return window.happoProcessor.processCurrent();
};

window.happo.init = (options) => window.happoProcessor.init(options);
