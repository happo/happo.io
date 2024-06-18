import { PNG } from 'pngjs';
import fetch from 'node-fetch';
import { SignJWT } from 'jose';

export default async function fetchPng(url, { apiKey, apiSecret, endpoint }) {
  const headers = {};

  if (url.startsWith(endpoint)) {
    const encodedSecret = new TextEncoder().encode(apiSecret);
    // https://github.com/panva/jose/blob/main/docs/classes/jwt_sign.SignJWT.md
    const signed = await new SignJWT({ key: apiKey })
      .setProtectedHeader({ alg: 'HS256', kid: apiKey })
      .sign(encodedSecret);

    headers.Authorization = `Bearer ${signed}`;
  }

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PNG at ${url}. Response ${
        response.status
      }: ${await response.text()}`,
    );
  }

  const contentType = response.headers.get('Content-Type') || 'unknown';

  if (!url.startsWith(endpoint) && !contentType.startsWith('image/png')) {
    throw new Error(
      `Failed to fetch PNG at ${url}. Response has wrong content type: ${contentType}`,
    );
  }

  return new Promise((resolve, reject) => {
    response.body
      .pipe(new PNG())
      .on('parsed', function handleParsed() {
        resolve(this);
      })
      .on('error', reject);
  });
}
