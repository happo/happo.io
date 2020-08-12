import parseSrcset from 'parse-srcset';

import stripQueryStringAndHash from './stripQueryStringAndHash';
import findCSSAssetPaths from './findCSSAssetPaths';

function isAbsoluteUrl(src) {
  return src.startsWith('http') || src.startsWith('//');
}

export default function findAssetPaths(doc = document) {
  const imgPaths = Array.from(doc.querySelectorAll('img[src]')).map((img) =>
    img.getAttribute('src'),
  );

  doc.querySelectorAll('img[srcset], picture source[srcset]').forEach((el) => {
    parseSrcset(el.getAttribute('srcset')).forEach((parsed) => {
      imgPaths.push(parsed.url);
    });
  });

  doc.querySelectorAll('[style]').forEach((el) => {
    findCSSAssetPaths({ css: el.getAttribute('style') }).forEach((path) => {
      imgPaths.push(path.resolvePath);
    });
  });

  return imgPaths
    .filter((url) => !isAbsoluteUrl(url) && url.trim().length)
    .map(stripQueryStringAndHash);
}
