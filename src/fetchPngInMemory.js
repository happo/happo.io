import { PNG } from 'pngjs';
import request from 'request';

import authForFetch from './authForFetch';

export default function fetchPngInMemory(url, { apiKey, apiSecret, endpoint }) {
  return new Promise((resolve, reject) => {
    request(
      {
        url,
        auth: authForFetch({ url, apiKey, apiSecret, endpoint }),
        encoding: null,
      },
      (error, response, body) => {
        if (error) {
          return reject(error);
        }
        new PNG({ filterType: 4 }).parse(body, (e, data) => {
          if (e) {
            return reject(e);
          }
          resolve(data);
        });
      },
    );
  });
}
