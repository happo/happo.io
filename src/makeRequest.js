import asyncRetry from 'async-retry';
import jwt from 'jsonwebtoken';
import request from 'request-promise-native';

export default async function makeRequest(
  requestAttributes,
  { apiKey, apiSecret, maxTries = 0 },
) {
  return asyncRetry(
    async () => {
      const signed = jwt.sign({ key: apiKey }, apiSecret, {
        header: { kid: apiKey },
      });
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
    },
    {
      retries: maxTries,
      onRetry: () => {
        const { method, url } = requestAttributes;
        console.warn(`Failed ${method} ${url}. Retrying...`);
      },
    },
  );
}
