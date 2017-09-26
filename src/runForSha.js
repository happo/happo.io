import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import fetchReport from './fetchReport';
import loadCSSFile from './loadCSSFile';
import loadUserConfig from './loadUserConfig';
import processSnapsInBundle from './processSnapsInBundle';
import uploadReport from './uploadReport';

export default async function runForSha(sha, {
  config: {
    apiKey,
    apiSecret,
    setupScript,
    webpackLoaders,
    stylesheets,
    include,
    targets,
    viewerEndpoint,
  },
}) {
  try {
    console.log(`Checking for previous report for ${sha}...`);
    const existingReport = await fetchReport({
      sha,
      apiKey,
      apiSecret,
      endpoint: viewerEndpoint,
    });
    console.log('Found one!');
  } catch (e) {
    console.log('...none exist');
  }

  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint({ setupScript, include });

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile, { webpackLoaders });

  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  console.log('Executing bundle...');
  const snapPayloads = await processSnapsInBundle(bundleFile, {
    globalCSS: cssBlocks.join('').replace(/\n/g, ''),
  });

  console.log('Generating screenshots...');
  const results = await Promise.all(Object.keys(targets).map(async (name) => {
    const result = await targets[name].execute({
      snaps: snapPayloads,
      apiKey,
      apiSecret,
    });
    return { name, result };
  }));

  const snaps = await constructReport(results);
  await uploadReport({
    snaps,
    sha,
    endpoint: viewerEndpoint,
    apiKey,
    apiSecret,
  });
}
