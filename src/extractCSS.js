export default function extractCSS(dom) {
  const styleElements = Array.from(dom.window.document.querySelectorAll('style'));
  return styleElements.map((el) => el.innerHTML).join('\n');
}
