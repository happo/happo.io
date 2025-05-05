import React from 'react';
import { createPortal } from 'react-dom';

import Button from './Button.ffs';
import ThemeContext from '../theme';
import imageSrc from './static/1x1.png';

const dynamicImportPromise = import('./dynamically-imported');

export default function Foo() {
  window.injectCSS('button { color: red }');
  return <Button />;
}

export const anotherVariant = () => {
  const style = document.createElement('style');
  document.head.appendChild(style);
  style.sheet.insertRule('button { text-align: center }');
  return <button type="button">Click meish</button>;
};

const PortalComponent = ({ children }) => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return createPortal(children, document.body);
};

export const portalExample = () => (
  <PortalComponent>
    {window.navigator.userAgent === 'happo-puppeteer'
      ? 'forbidden'
      : window.localStorage.getItem('foobar')}
    <button type="button">I am in a portal</button>
  </PortalComponent>
);

export const innerPortal = () => (
  <>
    <div>Outside portal</div>
    <PortalComponent>Inside portal</PortalComponent>
  </>
);

class AsyncComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      label: 'Not ready',
    };
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
    const { ready, label } = this.state;

    if (!ready) {
      return null;
    }

    return <button type="button">{label}</button>;
  }
}

export const asyncExample = (render) => {
  render(<AsyncComponent />);
  window.dispatchEvent(new CustomEvent('set-label', { detail: 'Ready' }));
  return new Promise((resolve) => {
    setTimeout(resolve, 11);
  });
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
    this.setState({ text: `${res.default} ${res.world}` });
  }

  render() {
    const { text } = this.state;
    return <div>{text}</div>;
  }
}

export const dynamicImportExample = () => <DynamicImportExample />;

export const themedExample = () => (
  <ThemeContext.Consumer>
    {(theme) => <button type="button">I am {theme}</button>}
  </ThemeContext.Consumer>
);

export const themedExampleAsync = (renderInDom) => {
  renderInDom(
    <ThemeContext.Consumer>
      {(theme) => <button type="button">I am {theme}</button>}
    </ThemeContext.Consumer>,
  );
  return new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
};

class RAFExample extends React.Component {
  async componentDidMount() {
    window.requestAnimationFrame(() => {
      this.setState({ label: 'Loaded' });
    });
  }

  render() {
    if (!this.state) {
      return null;
    }

    const { label } = this.state;

    return <div>{label}</div>;
  }
}

export const rafExample = () => <RAFExample />;

class RAFUnmountExample extends React.Component {
  async componentDidMount() {
    this.raf = window.requestAnimationFrame(() => {
      document.title = 'Foobar';
    });
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.raf);
  }

  render() {
    if (!this.state) {
      return <div>Not loaded</div>;
    }

    const { label } = this.state;

    return <div>{label}</div>;
  }
}

export const rafUnmountExample = () => <RAFUnmountExample />;

export const imageExample = () => <img alt="empty" src={imageSrc} />;
