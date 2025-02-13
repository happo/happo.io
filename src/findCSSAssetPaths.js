import path from 'path';

import stripQueryStringAndHash from './stripQueryStringAndHash';

const URL_PATTERN = /url\(['"]?(\/?[^)"']+)['"]?\)/g;

/**
 * @param {string} css - The css code, e.g. ".foo { background: url(/foo.png); }"
 * @param {string} [source] - An optional path to the css file where the css is
 *   coming from. This is used to make the resulting `resolvePath` relative to
 *   the css file.
 * @return {object} an object containing an `assetPath` and a `resolvePath`. The
 *   assetPath is the path as it's described in the css. The resolvePath is the
 *   path where we should attempt to locate the file in the filesystem.
 */
export default function findCSSAssetPaths({ css, source }) {
  const paths = Array.from(css.matchAll(URL_PATTERN))
    .map((match) => match[1])
    .filter((url) => !/^http|\/\//.test(url))
    .map(stripQueryStringAndHash);

  if (!source) {
    return paths.map((p) => ({ assetPath: p, resolvePath: p }));
  }

  const dir = path.dirname(source);

  return paths.map((url) => {
    if (url.startsWith('/')) {
      // absolute url
      return { assetPath: url, resolvePath: url };
    }

    const assetPath = path.join(dir, url);
    return { assetPath, resolvePath: url };
  });
}
