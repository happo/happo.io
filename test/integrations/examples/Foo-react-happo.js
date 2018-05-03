import React from 'react';
import ReactDOM from 'react-dom';

function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default () => {
  injectCSS('button { color: red }');
  return <button>Click me</button>;
};

export const anotherVariant = () => {
  injectCSS('button { text-align: center }');
  return <button>Click meish</button>;
};

const PortalComponent = ({ children }) => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return ReactDOM.createPortal(children, element);
};

export const portalExample = () => (
  <PortalComponent>
    <button>I am in a portal</button>
  </PortalComponent>
);
