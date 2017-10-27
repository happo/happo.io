import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import loadCSSFile from './loadCSSFile';
import processSnapsInBundle from './processSnapsInBundle';

export default async function reactDOMRunner({
  apiKey,
  apiSecret,
  setupScript,
  customizeWebpackConfig,
  stylesheets,
  include,
  endpoint,
  targets,
}, { only, onReady }
) {
  async function readyHandler(bundleFile) {
    const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));
    const { globalCSS, snapPayloads } = await processSnapsInBundle(bundleFile, {
      globalCSS: cssBlocks.join('').replace(/\n/g, ''),
    });
    if (!snapPayloads.length) {
      throw new Error('No items in report');
    }

    console.log('Generating screenshots...');
    const results = await Promise.all(Object.keys(targets).map(async (name) => {
      const result = await targets[name].execute({
        globalCSS,
        snapPayloads,
        apiKey,
        apiSecret,
        endpoint,
      });
      return { name, result };
    }));

    return await constructReport(results);
  }

  console.log('Initializing...');
  const entryFile = await createDynamicEntryPoint({ setupScript, include, only });

  if (onReady) {
    // We're in dev/watch mode
    createWebpackBundle(entryFile, { customizeWebpackConfig }, {
      onBuildReady: async (bundleFile) => {
        const report = await readyHandler(bundleFile);
        onReady(report);
      }
    });
    return;
  }

  const bundleFile = await createWebpackBundle(
    entryFile, { customizeWebpackConfig }, {});
  return await readyHandler(bundleFile);
}

