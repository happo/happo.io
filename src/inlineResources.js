import fileToBase64 from './fileToBase64';

export default function inlineResources(dom, { publicFolders }) {
  const imgs = dom.window.document.querySelectorAll('img[src]');
  imgs.forEach((img) => {
    const src = img.getAttribute('src');
    if (!src.startsWith('/')) {
      // not something that we can resolve
      return;
    }
    const base64 = fileToBase64(src, { publicFolders });
    if (base64) {
      img.setAttribute('src', base64);
    }
  });

  // return something to make it easier to test
  return dom.window.document.querySelector('body *').innerHTML.trim();
}
