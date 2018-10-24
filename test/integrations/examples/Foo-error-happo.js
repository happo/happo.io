function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default () => {
  // Injecting bad css won't cause things to fail, but it does produce error
  // logs that we want to make sure are showing up.
  injectCSS('{ this is invalid }');
  throw new Error('Something is wrong');
};
