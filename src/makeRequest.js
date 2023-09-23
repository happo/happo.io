import AbortController from 'abort-controller';
import FormData from 'form-data';
import HttpsProxyAgent from 'https-proxy-agent';
import asyncRetry from 'async-retry';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

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
  const body = formData
    ? prepareFormData(formData)
    : jsonBody
    ? JSON.stringify(jsonBody)
    : undefined;

  return asyncRetry(
    async () => {
      const start = Date.now();
      const signed = jwt.sign({ key: apiKey }, apiSecret, {
        header: { kid: apiKey },
      });

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
        const response = await fetch(
          url,
          Object.assign(
            {
              headers,
              compress: true,
              agent: HTTP_PROXY ? new HttpsProxyAgent(HTTP_PROXY) : undefined,
              signal: controller.signal,
            },
            requestAttributes,
            { body },
          ),
        );
        const totalTime = Date.now() - start;
        if (!response.ok) {
          const e = new Error(
            `Request to ${method} ${url} failed after ${totalTime} ms: ${
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
