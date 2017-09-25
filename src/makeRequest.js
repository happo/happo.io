import request from 'request-promise-native';
import jwt from 'jsonwebtoken';

export default function makeRequest(requestAttributes, { apiKey, apiSecret }) {
  const signed = jwt.sign({ key: apiKey }, apiSecret, { header: { kid: apiKey } });
  return request(
    Object.assign({
      auth: {
        bearer: signed,
      },
    }, requestAttributes),
  );
}
