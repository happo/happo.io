import parseSrcset from 'parse-srcset';

function isAbsoluteUrl(src) {
  return src.startsWith('http') || src.startsWith('//');
}

export default function findAssetPaths(doc = document) {
  const imgPaths = Array.from(doc.querySelectorAll('img[src]')).map((img) =>
    img.getAttribute('src'),
  );

  doc.querySelectorAll('img[srcset]').forEach((img) => {
    parseSrcset(img.getAttribute('srcset')).forEach((parsed) => {
      imgPaths.push(parsed.url);
    });
  });

  return imgPaths.filter((url) => !isAbsoluteUrl(url) && url.trim().length);
}
