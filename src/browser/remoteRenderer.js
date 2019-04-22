window.happo = window.happo || {};

window.happo.initChunk = () => {};
window.happo.nextExample = () => {
  if (!window.happoProcessor.next()) {
    return;
  }
  return window.happoProcessor.processCurrent();
};
