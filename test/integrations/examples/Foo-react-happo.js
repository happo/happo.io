import React from 'react';

function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default () => {
  injectCSS('button { color: red }');
  return (
    <button>Click me</button>
  );
};

export const anotherVariant = () => {
  injectCSS('button { text-align: center }');
  return (
    <button>Click meish</button>
  );
};
