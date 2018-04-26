import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import loadCSSFile from './loadCSSFile';
import processSnapsInBundle from './processSnapsInBundle';

function defaultLogger(message) {
  console.log(message);
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
  async function readyHandler(bundleFile, logger = defaultLogger) {
    const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

    logger('Generating screenshots...');
    const results = await Promise.all(
      Object.keys(targets).map(async (name) => {
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
          logger,
        });
        return { name, result };
      }),
    );
    return await constructReport(results);
  }

  console.log('Initializing...');
  const entryFile = await createDynamicEntryPoint({ setupScript, include, only, type });

  if (onReady) {
    let currentBuildPromise;
    // We're in dev/watch mode
    createWebpackBundle(
      entryFile,
      { type, customizeWebpackConfig },
      {
        onBuildReady: async (bundleFile) => {
          if (currentBuildPromise) {
            console.log('-------------------------------');
            currentBuildPromise.cancelled = true;
          }
          const buildPromise = readyHandler(bundleFile, (message) => {
            if (!buildPromise.cancelled) {
              console.log(message);
            }
          });
          currentBuildPromise = buildPromise;
          try {
            const report = await buildPromise;
            if (!buildPromise.cancelled) {
              onReady(report);
            }
          } catch (e) {
            console.error(e);
          }
        },
      },
    );
    return;
  }

  const bundleFile = await createWebpackBundle(entryFile, { type, customizeWebpackConfig }, {});
  return await readyHandler(bundleFile);
}
