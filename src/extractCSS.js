export default function extractCSS(dom) {
  const result = [];
  dom.window.document.querySelectorAll('style').forEach((styleElement) => {
    result.push(styleElement.innerHTML);
  });
  result.join('\n');
}
