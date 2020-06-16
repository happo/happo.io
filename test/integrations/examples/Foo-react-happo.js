/* global window */
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import Button from './Button.ffs';
import ThemeContext from '../theme';
import imageSrc from './static/1x1.png';

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

export const innerPortal = () => (
  <React.Fragment>
    <div>Outside portal</div>
    <PortalComponent>Inside portal</PortalComponent>
  </React.Fragment>
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
    return <div>{this.state.label}</div>;
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
    return <div>{this.state.label}</div>;
  }
}

export const rafUnmountExample = () => <RAFUnmountExample />;

export const imageExample = () => <img alt="empty" src={imageSrc} />;

function CanvasImage() {
  const ref = useRef();
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.moveTo(0, 0);
    ctx.lineTo(200, 100);
    ctx.stroke();
    ctx.font = '30px Arial';
    ctx.rotate(0.25);
    ctx.fillText('Hello World', 20, 50);
  });

  return (
    <canvas
      data-test="untainted-canvas"
      style={{ padding: 20 }}
      ref={ref}
      width="200"
      height="100"
    />
  );
}

export const canvas = () => <CanvasImage />;
