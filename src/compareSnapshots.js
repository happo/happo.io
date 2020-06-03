import asyncRetry from 'async-retry';
import colorDelta from 'lcs-image-diff/src/colorDelta';
import request from 'request';

import fetchPng from './fetchPng';
import fetchPngInMemory from './fetchPngInMemory';

function makeAbsolute(url, endpoint) {
  if (url.startsWith('http')) {
    return url;
  }
  return `${endpoint}${url}`;
}

function imageDiff({ bitmap1, bitmap2, compareThreshold }) {
  const len = bitmap1.width * bitmap1.height * 4;
  for (let i = 0; i < len; i += 4) {
    const distance = colorDelta(
      [
        bitmap1.data[i],
        bitmap1.data[i + 1],
        bitmap1.data[i + 2],
        bitmap1.data[i + 3],
      ],
      [
        bitmap2.data[i],
        bitmap2.data[i + 1],
        bitmap2.data[i + 2],
        bitmap2.data[i + 3],
      ],
    );
    if (distance > compareThreshold) {
      return distance;
    }
  }
}

async function fetchPngWithInMemoryFallback(url, { apiKey, apiSecret, endpoint }) {
  try {
    const res = await fetchPng(url, { apiKey, apiSecret, endpoint });
    return res;
  } catch (e1) {
    console.warn(
      'Failed to stream response directly to PNG. Printing stack trace, then falling back to in-memory read.',
    );
    console.warn(e1);
    try {
      const fallback = await fetchPngInMemory(url, { apiKey, apiSecret, endpoint });
      return fallback;
    } catch (e2) {
      throw new Error(
        `Failed to fetch PNG from ${url}. First error was "${e1.message}". Second error was "${e2.message}"`,
      );
    }
  }
}

async function fetchPngWithRetry(url, { retries, apiKey, apiSecret, endpoint }) {
  try {
    const bitmap = await asyncRetry(
      () => fetchPngWithInMemoryFallback(url, { apiKey, apiSecret, endpoint }),
      {
        retries,
        onRetry: (e) => {
          console.warn(`Retrying fetch for ${url}. Error was: ${e.message}`);
        },
      },
    );
    return bitmap;
  } catch (e) {
    await new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        const isPlainText =
          response && /^text\//.test(response.headers['content-type']);
        reject(
          new Error(
            `
Failed to fetch PNG at ${url} - here are some details for that URL:
  status code: ${response && response.statusCode}
  headers: ${response && JSON.stringify(response.headers, null, '  ')}
  error: ${error}
  body:
${isPlainText ? body : '(binary content hidden)'}

The original error was:
${e.stack}
          `.trim(),
          ),
        );
      });
    });
  }
}

export default async function compareSnapshots({
  before,
  after,
  endpoint,
  compareThreshold,
  retries = 5,
  apiKey,
  apiSecret,
}) {
  if (before.height !== after.height || before.width !== after.width) {
    return 1;
  }
  const [bitmap1, bitmap2] = await Promise.all([
    fetchPngWithRetry(makeAbsolute(before.url, endpoint), {
      retries,
      apiKey,
      apiSecret,
      endpoint,
    }),
    fetchPngWithRetry(makeAbsolute(after.url, endpoint), {
      retries,
      apiKey,
      apiSecret,
      endpoint,
    }),
  ]);

  return imageDiff({
    bitmap1,
    bitmap2,
    compareThreshold,
  });
}
