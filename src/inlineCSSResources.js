import fileToBase64 from './fileToBase64';

const URL_PATTERN = /url\(['"]?\/([^)"']+)['"]?\)/g;

export default function inlineResources(css, { publicFolders }) {
  return css.replace(URL_PATTERN, (match, url) => {
    const base64 = fileToBase64(url, { publicFolders });
    if (!base64) {
      return match;
    }
    return `url('${base64}')`;
  });
}
