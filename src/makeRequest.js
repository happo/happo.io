import AbortController from 'abort-controller';
import FormData from 'form-data';
import HttpsProxyAgent from 'https-proxy-agent';
import asyncRetry from 'async-retry';
import fetch from 'node-fetch';
import { SignJWT } from 'jose';

import { version } from '../package.json';

function prepareFormData(data) {
  if (!data) {
    return;
  }
  const form = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (typeof value === 'object' && value.options) {
      // We have a file
      form.append(key, value.value, value.options);
    } else {
      form.append(key, value);
    }
  });
  return form;
}

export default async function makeRequest(
  requestAttributes,
  {
    apiKey,
    apiSecret,
    retryCount = 0,
    /* legacy */ maxTries,
    timeout = 60000,
    retryMinTimeout,
    retryMaxTimeout,
  },
  { HTTP_PROXY } = process.env,
) {
  const { url, method = 'GET', formData, body: jsonBody } = requestAttributes;

  return asyncRetry(
    async () => {
      const start = Date.now();

      // We must avoid reusing FormData instances when retrying requests
      // because they are consumed and cannot be reused.
      // More info: https://github.com/node-fetch/node-fetch/issues/1743
      const body = formData
        ? prepareFormData(formData)
        : jsonBody
        ? JSON.stringify(jsonBody)
        : undefined;

      const encodedSecret = new TextEncoder().encode(apiSecret);
      // https://github.com/panva/jose/blob/main/docs/classes/jwt_sign.SignJWT.md
      const signed = await new SignJWT({ key: apiKey })
        .setProtectedHeader({ alg: 'HS256', kid: apiKey })
        .sign(encodedSecret);

      const headers = {
        Authorization: `Bearer ${signed}`,
        'User-Agent': `happo.io@${version}`,
      };

      if (jsonBody) {
        headers['Content-Type'] = 'application/json';
      }
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => {
        console.error(`Timing out request ${method} ${url} after ${timeout} ms.`);
        controller.abort();
      }, timeout);
      try {
        const response = await fetch(url, {
          headers,
          compress: true,
          agent: HTTP_PROXY ? new HttpsProxyAgent(HTTP_PROXY) : undefined,
          signal: controller.signal,
          ...requestAttributes,
          body,
        });
        if (!response.ok) {
          const e = new Error(
            `Request to ${method} ${url} failed: ${
              response.status
            } - ${await response.text()}`,
          );
          e.statusCode = response.status;
          throw e;
        }
        const result = await response.json();
        return result;
      } catch (e) {
        if (e.type === 'aborted') {
          e.message = `Timeout when fetching ${url} using method ${method}`;
        }
        e.message = `${e.message} (took ${Date.now() - start} ms)`;
        throw e;
      } finally {
        clearTimeout(abortTimeout);
      }
    },
    {
      retries: retryCount || maxTries,
      minTimeout: retryMinTimeout,
      maxTimeout: retryMaxTimeout,
      onRetry: (e) => {
        console.warn(`Failed ${method} ${url}. Retrying...`);
        console.warn(e);
      },
    },
  );
}
