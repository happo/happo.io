import http from 'http';

export default function loadCSSFile(cssFile) {
  return new Promise((resolve, reject) => {
    const request = http.request(cssFile, (res) => {
      const chunks = [];
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        resolve(chunks.join(''));
      });
    });
    request.on('error', (e) => {
      reject(e);
    });
    request.end();
  });
}
