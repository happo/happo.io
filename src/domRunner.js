import readline from 'readline';

import Logger from './Logger';
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

async function generateScreenshots({
  apiKey,
  apiSecret,
  stylesheets,
  endpoint,
  targets,
  publicFolders,
  getRootElement,
  only,
}, bundleFile, logger) {
  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  const targetNames = Object.keys(targets);
  logger.start(`Generating screenshots for ${targetNames.join(', ')}...`);
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
        const result = await targets[name].execute({
          globalCSS,
          snapPayloads,
          apiKey,
          apiSecret,
          endpoint,
        });
        return { name, result };
      }),
    );
    logger.success();
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
    const entryPointResult =
      await createDynamicEntryPoint({ setupScript, include, only, type });
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
      { type, customizeWebpackConfig },
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

  const bundleFile = await createWebpackBundle(entryFile, { type, customizeWebpackConfig }, {});
  logger.success();
  return boundGenerateScreenshots(bundleFile, logger);
}
