function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default () => {
  injectCSS('button { color: red }');
  // write straight to body
  document.body.innerHTML =
    '<div class="custom-root"><button>Click me</button></div>';
};

export const anotherVariant = () => {
  injectCSS('button { text-align: center }');
  // return to happo and let it render
  return '<div class="custom-root"><button>Click meish</button></div>';
};

export const asyncVariant = (renderInDOM) => {
  const root = renderInDOM(
    '<div class="custom-root"><button style="width: 100px"></button></div>',
  );
  setTimeout(() => {
    const button = root.querySelector('button');
    button.innerHTML = 'Ready';
    const { width } = button.getBoundingClientRect();
    button.style = `width: ${width * 2.5}px`;
  }, 10);

  return new Promise((resolve) => setTimeout(resolve, 11));
};

export const canvas = (renderInDOM) => {
  const root = renderInDOM(
    '<canvas width="200" height="100" style="border: 5px solid red"></canvas>',
  );
  return new Promise((resolve) =>
    setTimeout(() => {
      const cvas = root.querySelector('canvas');
      const ctx = cvas.getContext('2d');
      ctx.moveTo(0, 0);
      ctx.lineTo(200, 100);
      ctx.stroke();
      ctx.font = '30px Arial';
      ctx.rotate(0.25);
      ctx.fillText('Hello World', 20, 50);
      resolve();
    }, 10),
  );
};
