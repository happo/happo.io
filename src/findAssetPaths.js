import matchAll from 'string.prototype.matchall';

const SRCSET_ITEM = /([^\s]+)(\s+[0-9.]+[wx])?(,?\s*)/g;

function isAbsoluteUrl(src) {
  return src.startsWith('http') || src.startsWith('//');
}

export default function findAssetPaths(doc = document) {
  const imgPaths = Array.from(doc.querySelectorAll('img[src]')).map((img) =>
    img.getAttribute('src'),
  );

  doc.querySelectorAll('img[srcset]').forEach((img) => {
    Array.from(matchAll(img.getAttribute('srcset') || '', SRCSET_ITEM)).forEach((match) => {
      imgPaths.push(match[1]);
    });
  });

  return imgPaths.filter((url) => !isAbsoluteUrl(url) && url.trim().length);
}
