import Logger, { logTag } from './Logger';
import constructReport from './constructReport';
import createHash from './createHash';
import ensureTarget from './ensureTarget';
import loadCSSFile from './loadCSSFile';
import uploadAssets from './uploadAssets';
import deterministicArchive from './deterministicArchive';

async function resolvePackageData(staticPackage) {
  if (typeof staticPackage === 'string') {
    // legacy plugins
    const buffer = Buffer.from(staticPackage, 'base64');
    return { buffer, hash: createHash(buffer) };
  }

  if (!staticPackage.path) {
    throw new Error(
      'Expected `staticPackage` to be an object with the following structure: `{ path: "path/to/folder" }`',
    );
  }

  const archive = await deterministicArchive([staticPackage.path]);
  return archive;
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

    const { buffer, hash } = await resolvePackageData(staticPackage);
    const staticPackagePath = await uploadAssets(buffer, {
      hash,
      endpoint,
      apiSecret,
      apiKey,
      logger,
      project,
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
    const outerStartTime = Date.now();
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const startTime = Date.now();
        const result = await ensureTarget(targets[name]).execute({
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
