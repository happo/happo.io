import React from 'react';
import ReactDOM from 'react-dom';

import Button from './Button.ffs';

function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default () => {
  injectCSS('button { color: red }');
  return <Button />;
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
    {window.localStorage.getItem('foobar')}
    <button>I am in a portal</button>
  </PortalComponent>
);

class AsyncComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    setTimeout(() => this.setState({ ready: true }), 10);
  }

  setLabel(label) {
    this.setState({ label });
  }

  render() {
    if (!this.state.ready) {
      return null;
    }
    return <button>{this.state.label}</button>;
  }
}

export const asyncExample = (render) => {
  const component = render(<AsyncComponent />);
  component.setLabel('Ready');
  return new Promise((resolve) => setTimeout(resolve, 11));
};
