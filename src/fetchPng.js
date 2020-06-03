import { PNG } from 'pngjs';
import request from 'request';

import authForFetch from './authForFetch';

export default async function fetchPng(url, { apiKey, apiSecret, endpoint }) {
  return new Promise((resolve, reject) => {
    request({
      url,
      auth: authForFetch({ url, apiKey, apiSecret, endpoint }),
    })
      .on('error', reject)
      .pipe(new PNG())
      .on('parsed', function handleParsed() {
        resolve(this);
      })
      .on('error', reject);
  });
}
