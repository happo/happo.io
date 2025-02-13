import { logTag } from './Logger';
import makeRequest from './makeRequest';

/**
 * Uploads assets via Happo's API
 *
 * @param {Buffer|Stream} streamOrBuffer
 * @param {Object} options
 * @param {string} options.hash
 * @param {string} options.endpoint
 * @param {string} options.apiKey
 * @param {string} options.apiSecret
 * @param {Logger} options.logger
 * @param {string} options.project
 * @returns {Promise<string>} The URL of the uploaded assets
 */
async function uploadAssetsThroughHappo(
  streamOrBuffer,
  { hash, endpoint, apiKey, apiSecret, logger, project },
) {
  try {
    // Check if the assets already exist. If so, we don't have to upload them.
    const assetsDataRes = await makeRequest(
      {
        url: `${endpoint}/api/snap-requests/assets-data/${hash}`,
        method: 'GET',
        json: true,
      },
      { apiKey, apiSecret },
    );
    logger.info(
      `${logTag(project)}Reusing existing assets at ${
        assetsDataRes.path
      } (previously uploaded on ${assetsDataRes.uploadedAt})`,
    );
    return assetsDataRes.path;
  } catch (e) {
    if (e.statusCode !== 404) {
      logger.warn(
        `${logTag(
          project,
        )}Assuming assets don't exist since we got error response: ${
          e.statusCode
        } - ${e.message} - ${e.stack}`,
      );
    }
  }

  const assetsRes = await makeRequest(
    {
      url: `${endpoint}/api/snap-requests/assets/${hash}`,
      method: 'POST',
      json: true,
      formData: {
        payload: {
          options: {
            filename: 'payload.zip',
            contentType: 'application/zip',
          },
          value: streamOrBuffer,
        },
      },
    },
    { apiKey, apiSecret, retryCount: 2 },
  );

  return assetsRes.path;
}

/**
 * Uploads assets via signed URL
 *
 * @param {Buffer|Stream} streamOrBuffer
 * @param {Object} options
 * @param {string} options.hash
 * @param {string} options.endpoint
 * @param {string} options.apiKey
 * @param {string} options.apiSecret
 * @param {Logger} options.logger
 * @param {string} options.project
 * @returns {Promise<string>} The URL of the uploaded assets
 */
async function uploadAssetsWithSignedUrl(
  streamOrBuffer,
  { hash, endpoint, apiKey, apiSecret, logger, project },
) {
  // First we need to get the signed URL from Happo.
  const signedUrlRes = await makeRequest(
    {
      url: `${endpoint}/api/snap-requests/assets/${hash}/signed-url`,
      method: 'GET',
      json: true,
    },
    { apiKey, apiSecret, retryCount: 3 },
  );

  if (!signedUrlRes) {
    throw new Error('Failed to get signed URL');
  }

  // If the asset has already been uploaded, we can return the path now.
  if (signedUrlRes.path) {
    logger.info(`${logTag(project)}Reusing existing assets at ${signedUrlRes.path}`);
    return signedUrlRes.path;
  }

  // Upload the assets to the signed URL using node's built-in fetch.
  const putRes = await fetch(signedUrlRes.signedUrl, {
    method: 'PUT',
    body: streamOrBuffer,
    headers: {
      'Content-Type': 'application/zip',
    },
  });

  if (!putRes.ok) {
    throw new Error(
      `Failed to upload assets to S3 signed URL: ${putRes.status} ${putRes.statusText}`,
    );
  }

  // Finally, we need to tell Happo that we've uploaded the assets.
  const finalizeRes = await makeRequest(
    {
      url: `${endpoint}/api/snap-requests/assets/${hash}/finalize`,
      method: 'POST',
      json: true,
    },
    { apiKey, apiSecret, retryCount: 3 },
  );

  return finalizeRes.path;
}

export default async function uploadAssets(streamOrBuffer, options) {
  if (process.env.HAPPO_SIGNED_URL) {
    return uploadAssetsWithSignedUrl(streamOrBuffer, options);
  }

  return uploadAssetsThroughHappo(streamOrBuffer, options);
}
