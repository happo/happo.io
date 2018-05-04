function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default () => {
  injectCSS('button { color: red }');
  // write straight to body
  document.body.innerHTML = '<button>Click me</button>';
};

export const anotherVariant = () => {
  injectCSS('button { text-align: center }');
  // return to happo and let it render
  return '<button>Click meish</button>';
};

export const asyncVariant = (renderInDOM) => {
  const root = renderInDOM('<button></button>');
  setTimeout(() => {
    root.querySelector('button').innerHTML = 'Ready';
  }, 10);

  return new Promise((resolve) => setTimeout(resolve, 11));
};
