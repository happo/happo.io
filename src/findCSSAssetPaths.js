import matchAll from 'string.prototype.matchall';

const URL_PATTERN = /url\(['"]?(\/?[^)"']+)['"]?\)/g;

export default function findCSSAssetPaths(css) {
  return Array.from(matchAll(css, URL_PATTERN))
    .map((match) => match[1])
    .filter((url) => !/^http|\/\//.test(url));
}
