import ReactDOM from 'react-dom';

import extractCSS from './extractCSS';

export default function processSnap({ name, renderFunc }) {
  document.body.innerHTML = '';
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  ReactDOM.render(renderFunc(), rootElement);

  return {
    css: extractCSS(),
    html: rootElement.innerHTML,
  }
}
