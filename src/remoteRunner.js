import { performance } from 'perf_hooks';

import Logger from './Logger';
import constructReport from './constructReport';
import createHash from './createHash';
import loadCSSFile from './loadCSSFile';
import makeRequest from './makeRequest';

async function uploadStaticPackage({ staticPackage, endpoint, apiKey, apiSecret }) {
  const buffer = Buffer.from(staticPackage, 'base64');
  const hash = createHash(staticPackage);
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
          value: buffer,
        },
      },
    },
    { apiKey, apiSecret, maxTries: 2 },
  );
  return assetsRes.path;
}

export default async function remoteRunner(
  { apiKey, apiSecret, endpoint, targets, plugins, stylesheets },
  { generateStaticPackage },
  { isAsync },
) {
  const logger = new Logger();
  try {
    logger.info('Generating static package...');
    const staticPackage = await generateStaticPackage();
    const staticPackagePath = await uploadStaticPackage({
      staticPackage,
      endpoint,
      apiSecret,
      apiKey,
    });
    const targetNames = Object.keys(targets);
    const tl = targetNames.length;
    const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));
    plugins.forEach(({ css }) => cssBlocks.push(css || ''));
    logger.info(`Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
    const outerStartTime = performance.now();
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const startTime = performance.now();
        const result = await targets[name].execute({
          targetName: name,
          asyncResults: isAsync,
          staticPackage: staticPackagePath,
          apiKey,
          apiSecret,
          endpoint,
          globalCSS: cssBlocks.join('').replace(/\n/g, ''),
        });
        logger.start(`  - ${name}`, { startTime });
        logger.success();
        return { name, result };
      }),
    );
    logger.start(undefined, { startTime: outerStartTime });
    logger.success();
    if (isAsync) {
      return results;
    }
    return constructReport(results);
  } catch (e) {
    logger.fail();
    throw e;
  }
}
