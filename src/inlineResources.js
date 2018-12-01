import { JSDOM } from 'jsdom';
import matchAll from 'string.prototype.matchall';

import fileToBase64 from './fileToBase64';

const SRCSET_ITEM = /([^\s]+)(\s+[0-9.]+[wx])?(,?\s*)/g;

function isAbsoluteUrl(src) {
  return src.startsWith('http') || src.startsWith('//');
}

function inlineImgSrcset(dom, { publicFolders }) {
  const imgs = dom.window.document.querySelectorAll('img[srcset]');
  imgs.forEach((img) => {
    const newSrcset = Array.from(matchAll(img.getAttribute('srcset') || '', SRCSET_ITEM))
      .map(([_, url, size]) => { // eslint-disable-line no-unused-vars
        if (isAbsoluteUrl(url)) {
          // not something that we can resolve
          return `${url}${size || ''}`;
        }
        return `${fileToBase64(url, { publicFolders }) || url}${size || ''}`;
      })
      .filter(Boolean)
      .join(', ');
    img.setAttribute('srcset', newSrcset);
  });
}

function inlineImgSrc(dom, { publicFolders }) {
  const imgs = dom.window.document.querySelectorAll('img[src]');
  imgs.forEach((img) => {
    const src = img.getAttribute('src');
    if (isAbsoluteUrl(src)) {
      // not something that we can resolve
      return;
    }
    const base64 = fileToBase64(src, { publicFolders });
    if (base64) {
      img.setAttribute('src', base64);
    }
  });
}

export default function inlineResources(html, { publicFolders }) {
  const dom = new JSDOM(html);
  inlineImgSrc(dom, { publicFolders });
  inlineImgSrcset(dom, { publicFolders });
  return dom.window.document.body.innerHTML.trim();
}
