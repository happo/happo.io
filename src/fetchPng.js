import { PNG } from 'pngjs';
import request from 'request';

export default async function fetchPng(url) {
  return new Promise((resolve, reject) => {
    request({
      url,
    })
      .on('error', reject)
      .pipe(new PNG())
      .on('parsed', function handleParsed() {
        resolve(this);
      })
      .on('error', reject);
  });
}
