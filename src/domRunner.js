import readline from 'readline';

import Logger from './Logger';
import MultipleErrors from './MultipleErrors';
import WrappedError from './WrappedError';
import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import loadCSSFile from './loadCSSFile';
import processSnapsInBundle from './processSnapsInBundle';

function waitForAnyKey() {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve) => {
    process.stdin.once('keypress', (_, key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit();
      } else {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      }
    });
  });
}

async function generateScreenshots(
  { apiKey, apiSecret, stylesheets, endpoint, targets, publicFolders, getRootElement, only },
  bundleFile,
  logger,
) {
  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  const targetNames = Object.keys(targets);
  const tl = targetNames.length;
  logger.info(`Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
  try {
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const { globalCSS, snapPayloads } = await processSnapsInBundle(bundleFile, {
          globalCSS: cssBlocks.join('').replace(/\n/g, ''),
          publicFolders,
          getRootElement,
          only,
          viewport: targets[name].viewport,
        });
        if (!snapPayloads.length) {
          throw new Error('No examples found');
        }
        const errors = snapPayloads.filter((p) => p instanceof WrappedError);
        if (errors.length === 1) {
          throw errors[0];
        }
        if (errors.length > 1) {
          throw new MultipleErrors(errors);
        }

        const result = await targets[name].execute({
          globalCSS,
          snapPayloads,
          apiKey,
          apiSecret,
          endpoint,
        });
        logger.start(`  - ${name}`);
        logger.success();
        return { name, result };
      }),
    );
    return constructReport(results);
  } catch (e) {
    logger.fail();
    throw e;
  }
}

export default async function domRunner(
  {
    apiKey,
    apiSecret,
    setupScript,
    customizeWebpackConfig,
    stylesheets,
    include,
    endpoint,
    targets,
    publicFolders,
    getRootElement,
    type,
    plugins,
  },
  { only, onReady },
) {
  const boundGenerateScreenshots = generateScreenshots.bind(null, {
    apiKey,
    apiSecret,
    stylesheets,
    endpoint,
    targets,
    publicFolders,
    getRootElement,
    only,
  });
  const logger = new Logger();
  logger.start('Reading files...');
  let entryFile;
  try {
    const entryPointResult = await createDynamicEntryPoint({
      setupScript,
      include,
      only,
      type,
      plugins,
    });
    entryFile = entryPointResult.entryFile;
    logger.success(`${entryPointResult.numberOfFilesProcessed} found`);
  } catch (e) {
    logger.fail(e);
    throw e;
  }

  logger.start('Creating bundle...');

  if (onReady) {
    let currentBuildPromise;
    let currentLogger;
    let currentWaitPromise;
    // We're in dev/watch mode
    createWebpackBundle(
      entryFile,
      { type, customizeWebpackConfig, plugins },
      {
        onBuildReady: async (bundleFile) => {
          if (currentBuildPromise) {
            currentBuildPromise.cancelled = true;
            currentLogger.mute();
            if (currentWaitPromise) {
              currentWaitPromise.cancelled = true;
            } else {
              logger.divider();
              logger.info('Changes detected. Press any key to continue.');
            }
            const waitPromise = waitForAnyKey();
            currentWaitPromise = waitPromise;
            await waitPromise;
            if (waitPromise.cancelled) {
              return;
            }
            logger.divider();
          } else {
            logger.success();
          }
          currentWaitPromise = undefined;
          const mutableLogger = new Logger();
          const buildPromise = boundGenerateScreenshots(bundleFile, mutableLogger);
          currentLogger = mutableLogger;
          currentBuildPromise = buildPromise;
          try {
            const report = await buildPromise;
            if (!buildPromise.cancelled) {
              onReady(report);
            }
          } catch (e) {
            logger.error(e);
          }
        },
      },
    );
    return;
  }

  const bundleFile = await createWebpackBundle(
    entryFile,
    { type, customizeWebpackConfig, plugins },
    {},
  );
  logger.success();
  return boundGenerateScreenshots(bundleFile, logger);
}
