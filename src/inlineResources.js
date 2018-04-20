import fs from 'fs';
import path from 'path';

function fileToBase64(src, { publicFolders }) {
  for (let folder of publicFolders) {
    const pathToFile = path.join(folder, src);
    if (fs.existsSync(pathToFile)) {
      const base64 = new Buffer(fs.readFileSync(pathToFile)).toString('base64');
      const extension = path.extname(pathToFile);
      let mime = extension.replace(/\./, 'image/');
      if (extension === '.svg') {
        mime = `${mime}+xml`;
      }
      return `data:${mime};charset=utf-8;base64,${base64}`;
    }
  }
}

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
