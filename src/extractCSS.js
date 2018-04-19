export default function extractCSS() {
  const result = [];
  document.querySelectorAll('style').forEach((styleElement) => {
    result.push(styleElement.innerHTML);
  });
  result.join('\n');
}

