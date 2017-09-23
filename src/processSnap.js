import extractCSS from './extractCSS';

export default function processSnap(dom, { component, variant }) {
  const safeComponent = JSON.stringify(component);
  const safeVariant = JSON.stringify(variant);
  const html = dom.window.eval(`
    document.body.innerHTML = \'\';
    const rootElement = document.createElement(\'div\');
    document.body.appendChild(rootElement);
    let reactComponent = window.snaps[${safeComponent}][${safeVariant}]();
    if (typeof reactComponent === \'string\') {
      throw new Error(\'Component ${safeComponent}, ${safeVariant} is a string\');
    }
    ReactDOM.render(reactComponent, rootElement);
    rootElement.innerHTML;
  `);

  return {
    css: extractCSS(dom),
    html,
  }
}
