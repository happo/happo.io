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
  { apiKey, apiSecret, maxTries = 0, minTimeout, maxTimeout },
  { HTTP_PROXY } = process.env,
) {
  const { url, method, formData, body: jsonBody } = requestAttributes;
  const body = formData
    ? prepareFormData(formData)
    : jsonBody
    ? JSON.stringify(jsonBody)
    : undefined;

  return asyncRetry(
    async () => {
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
      const response = await fetch(
        url,
        Object.assign(
          {
            headers,
            compress: true,
            agent: HTTP_PROXY ? new HttpsProxyAgent(HTTP_PROXY) : undefined,
          },
          requestAttributes,
          { body },
        ),
      );
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
    },
    {
      retries: maxTries,
      minTimeout,
      maxTimeout,
      onRetry: () => {
        console.warn(`Failed ${method} ${url}. Retrying...`);
      },
    },
  );
}
