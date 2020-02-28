import { PNG } from 'pngjs';
import request from 'request';

export default function fetchPngInMemory(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      new PNG({ filterType: 4 }).parse(body, (e, data) => {
        if (e) {
          return reject(e);
        }
        resolve(data);
      });
    });
  });
}
