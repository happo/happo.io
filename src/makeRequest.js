import jwt from 'jsonwebtoken';
import request from 'request-promise-native';

function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default async function makeRequest(
  requestAttributes,
  { apiKey, apiSecret, maxTries = 0 },
  tryNumber = 1,
) {
  const signed = jwt.sign({ key: apiKey }, apiSecret, { header: { kid: apiKey } });
  try {
    const result = await request(
      Object.assign(
        {
          gzip: true,
          auth: {
            bearer: signed,
          },
        },
        requestAttributes,
      ),
    );
    return result;
  } catch (e) {
    if (tryNumber >= maxTries) {
      throw e;
    }

    const { method, url } = requestAttributes;

    // Exponential backoff with full jitter.
    // https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
    const nextRetryIn = randomIntInRange(1000, 1000 * 2 ** tryNumber);
    console.warn(`Failed ${method} ${url}. Retrying after ${(nextRetryIn / 1000).toFixed(1)}s...`);

    await new Promise((resolve) => setTimeout(resolve, nextRetryIn));
    return makeRequest(
      requestAttributes,
      {
        apiKey,
        apiSecret,
        maxTries,
      },
      tryNumber + 1,
    );
  }
}
