function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default () => {
  injectCSS('button { color: red }');
  document.body.innerHTML = '<button>Click me</button>';
};

export const anotherVariant = () => {
  injectCSS('button { text-align: center }');
  document.body.innerHTML = '<button>Click meish</button>';
};
