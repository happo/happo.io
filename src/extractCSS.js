export default function extractCSS(dom) {
  return dom.window.eval(`
    const result = [];
    document.querySelectorAll(\'style\').forEach((styleElement) => {
      result.push(styleElement.innerHTML);
    });
    result.join(\'\\n\');
  `);
}

