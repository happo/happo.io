window.happo = window.happo || {};

window.happo.initChunk = () => {};
window.happo.nextExample = () => {
  if (!window.happoProcessor.next()) {
    return Promise.resolve(undefined);
  }
  return window.happoProcessor.processCurrent();
};
