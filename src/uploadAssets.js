import { logTag } from './Logger';
import makeRequest from './makeRequest';

export default async function uploadAssets(
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
