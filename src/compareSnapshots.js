import asyncRetry from 'async-retry';
import colorDelta from 'lcs-image-diff/src/colorDelta';

import fetchPng from './fetchPng';

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

async function fetchPngWithRetry(url, { retries, apiKey, apiSecret, endpoint }) {
  const bitmap = await asyncRetry(
    () => fetchPng(url, { apiKey, apiSecret, endpoint }),
    {
      retries,
      onRetry: (e) => {
        console.warn(`Retrying fetch for ${url}. Error was: ${e.message}`);
      },
    },
  );
  return bitmap;
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
