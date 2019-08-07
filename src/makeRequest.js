import jwt from 'jsonwebtoken';
import request from 'request-promise-native';

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
    console.warn(`Failed ${requestAttributes.method} ${requestAttributes.url}. Retrying after 2s...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
