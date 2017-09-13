import extractCSS from './extractCSS';

export default function processSnap(dom, { file, name }) {
  const safeFile = JSON.stringify(file);
  const safeName = JSON.stringify(name);
  const html = dom.window.eval(`
    document.body.innerHTML = \'\';
    const rootElement = document.createElement(\'div\');
    document.body.appendChild(rootElement);
    let component = window.snaps[${safeFile}][${safeName}]();
    if (typeof component === \'string\') {
      throw new Error(\'Component ${safeFile}, ${safeName} is a string\');
    }
    ReactDOM.render(component, rootElement);
    rootElement.innerHTML;
  `);

  return {
    css: extractCSS(dom),
    html,
  }
}
