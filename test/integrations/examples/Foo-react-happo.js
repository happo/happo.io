/* global window */
import React from 'react';
import ReactDOM from 'react-dom';

import Button from './Button.ffs';
import ThemeContext from '../theme';

const dynamicImportPromise = import('./dynamically-imported');

export default () => {
  window.injectCSS('button { color: red }');
  return <Button />;
};

export const anotherVariant = () => {
  const style = document.createElement('style');
  document.head.appendChild(style);
  style.sheet.insertRule('button { text-align: center }');
  return <button>Click meish</button>;
};

const PortalComponent = ({ children }) => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return ReactDOM.createPortal(children, element);
};

export const portalExample = () => (
  <PortalComponent>
    {window.navigator.userAgent === 'happo-puppeteer'
      ? 'forbidden'
      : window.localStorage.getItem('foobar')}
    <button>I am in a portal</button>
  </PortalComponent>
);

class AsyncComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.setLabel = this.setLabel.bind(this);
  }

  componentDidMount() {
    setTimeout(() => this.setState({ ready: true }), 10);
    window.addEventListener('set-label', this.setLabel);
  }

  componentWillUnmount() {
    window.removeEventListener('set-label', this.setLabel);
  }

  setLabel(e) {
    this.setState({ label: e.detail });
  }

  render() {
    if (!this.state.ready) {
      return null;
    }
    return <button>{this.state.label}</button>;
  }
}

export const asyncExample = (render) => {
  render(<AsyncComponent />);
  window.dispatchEvent(new CustomEvent('set-label', { detail: 'Ready' })); // eslint-disable-line no-undef
  return new Promise((resolve) => setTimeout(resolve, 11));
};

export const asyncWithoutPromise = () => <AsyncComponent />;

function EmptyComponent() {
  return null;
}
export const emptyForever = () => <EmptyComponent />;

class DynamicImportExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const res = await dynamicImportPromise;
    this.setState({ text: `${res.default} ${res.world}` }); // eslint-disable-line react/no-did-mount-set-state
  }

  render() {
    return <div>{this.state.text}</div>;
  }
}

export const dynamicImportExample = () => <DynamicImportExample />;

export const themedExample = () => (
  <ThemeContext.Consumer>
    {(theme) => <button>I am {theme}</button>}
  </ThemeContext.Consumer>
);

export const themedExampleAsync = (renderInDom) => {
  renderInDom(
    <ThemeContext.Consumer>
      {(theme) => <button>I am {theme}</button>}
    </ThemeContext.Consumer>,
  );
  return new Promise((resolve) => setTimeout(resolve, 20));
};
