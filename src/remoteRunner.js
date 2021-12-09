import { performance } from 'perf_hooks';
import { Writable } from 'stream';

import Archiver from 'archiver';

import Logger, { logTag } from './Logger';
import constructReport from './constructReport';
import createHash from './createHash';
import loadCSSFile from './loadCSSFile';
import makeRequest from './makeRequest';

function staticDirToZipBuffer(dir) {
  return new Promise((resolve, reject) => {
    const archive = new Archiver('zip');

    const stream = new Writable();
    const data = [];

    // eslint-disable-next-line no-underscore-dangle
    stream._write = (chunk, enc, done) => {
      data.push(...chunk);
      done();
    };
    stream.on('finish', () => {
      resolve(Buffer.from(data));
    });
    archive.pipe(stream);

    archive.directory(dir, false);
    archive.on('error', reject);
    archive.finalize();
  });
}

function resolvePackageBuffer(staticPackage) {
  if (typeof staticPackage === 'string') {
    // legacy plugins
    return Buffer.from(staticPackage, 'base64');
  }

  if (!staticPackage.path) {
    throw new Error(
      'Expected `staticPackage` to be an object with the following structure: `{ path: "path/to/folder" }`',
    );
  }

  return staticDirToZipBuffer(staticPackage.path);
}

async function uploadStaticPackage({ staticPackage, endpoint, apiKey, apiSecret }) {
  const buffer = await resolvePackageBuffer(staticPackage);
  const hash = createHash(buffer);
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
  { apiKey, apiSecret, endpoint, targets, plugins, stylesheets, project },
  { generateStaticPackage },
  { isAsync },
) {
  const logger = new Logger();

  try {
    logger.info(`${logTag(project)}Generating static package...`);
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
    logger.info(
      `${logTag(project)}Generating screenshots in ${tl} target${
        tl > 1 ? 's' : ''
      }...`,
    );
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
        logger.start(`  - ${logTag(project)}${name}`, { startTime });
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
