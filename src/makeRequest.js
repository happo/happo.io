import request from 'request-promise-native';
import jwt from 'jsonwebtoken';

export default async function makeRequest(requestAttributes, { apiKey, apiSecret }, tryNumber = 1) {
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
    if (tryNumber >= 3) {
      throw e;
    }
    console.warn(`Failed to make request to ${requestAttributes.url}. Retrying after 2s...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return makeRequest(requestAttributes, { apiKey, apiSecret }, tryNumber + 1);
  }
}
