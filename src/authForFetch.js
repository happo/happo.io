import jwt from 'jsonwebtoken';

export default function authForFetch({ url, apiKey, apiSecret, endpoint }) {
  if (url.startsWith(endpoint)) {
    // We're making a request for an image at happo.io (
    return {
      bearer: jwt.sign({ key: apiKey }, apiSecret, {
        header: { kid: apiKey },
      }),
    };
  }
}
