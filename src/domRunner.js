import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

import JSDOMDomProvider from './JSDOMDomProvider';
import Logger from './Logger';
import MultipleErrors from './MultipleErrors';
import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import inlineCSSResources from './inlineCSSResources';
import loadCSSFile from './loadCSSFile';
import processSnapsInBundle from './processSnapsInBundle';

const { VERBOSE = 'false' } = process.env;

function logTargetResults({ name, globalCSS, snapPayloads }) {
  const cssPath = path.join(os.tmpdir(), `happo-verbose-${name}.css`);
  const snippetsPath = path.join(os.tmpdir(), `happo-snippets-${name}.json`);
  fs.writeFileSync(cssPath, JSON.stringify(globalCSS));
  fs.writeFileSync(snippetsPath, JSON.stringify(snapPayloads));
  console.log(`Recorded CSS for target "${name}" can be found in ${cssPath}`);
  console.log(`Recorded HTML snippets for target "${name}" can be found in ${snippetsPath}`);
}

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

function resolveDomProvider({ plugins, jsdomOptions }) {
  const pluginWithProvider = plugins.find(({ DomProvider }) => !!DomProvider);
  if (pluginWithProvider) {
    return pluginWithProvider.DomProvider;
  }
  return JSDOMDomProvider.bind(JSDOMDomProvider, jsdomOptions);
}

async function generateScreenshots(
  { apiKey, apiSecret, stylesheets, endpoint, targets, publicFolders, jsdomOptions, plugins },
  bundleFile,
  logger,
) {
  const cssBlocks = await Promise.all(
    stylesheets.map(async (sheet) => {
      const { source, id, conditional } =
        typeof sheet === 'string' ? { source: sheet } : sheet;
      const result = {
        css: await loadCSSFile(source),
      };
      if (id) result.id = id;
      if (conditional) result.conditional = conditional;
      return result;
    }),
  );
  plugins.forEach(({ css }) => {
    if (css) {
      cssBlocks.push({ css });
    }
  });
  await Promise.all(
    cssBlocks.map(async (block) => {
      block.css = await inlineCSSResources(block.css, { publicFolders });
    }),
  );

  const targetNames = Object.keys(targets);
  const tl = targetNames.length;
  const DomProvider = resolveDomProvider({ plugins, jsdomOptions });
  logger.info(`Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
  try {
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const { css, snapPayloads } = await processSnapsInBundle(bundleFile, {
          publicFolders,
          viewport: targets[name].viewport,
          DomProvider,
        });
        if (!snapPayloads.length) {
          throw new Error('No examples found');
        }
        const errors = snapPayloads.filter((p) => p.isError);
        if (errors.length === 1) {
          throw errors[0];
        }
        if (errors.length > 1) {
          throw new MultipleErrors(errors);
        }

        const globalCSS = cssBlocks.concat([
          {
            css: inlineCSSResources(css, { publicFolders }),
          },
        ]);

        if (VERBOSE === 'true') {
          logTargetResults({ name, globalCSS, snapPayloads });
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
    rootElementSelector,
    renderWrapperModule,
    type,
    plugins,
    tmpdir,
    jsdomOptions,
    asyncTimeout,
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
    only,
    jsdomOptions,
    plugins,
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
      tmpdir,
      rootElementSelector,
      renderWrapperModule,
      asyncTimeout,
    });
    entryFile = entryPointResult.entryFile;
    logger.success(`${entryPointResult.numberOfFilesProcessed} found`);
  } catch (e) {
    logger.fail(e);
    throw e;
  }

  fs.copyFileSync(
    path.resolve(__dirname, 'debug.html'),
    path.resolve(tmpdir, 'index.html'),
  );

  logger.start('Creating bundle...');

  if (onReady) {
    let currentBuildPromise;
    let currentLogger;
    let currentWaitPromise;
    // We're in dev/watch mode
    createWebpackBundle(
      entryFile,
      { type, customizeWebpackConfig, plugins, tmpdir },
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
    { type, customizeWebpackConfig, plugins, tmpdir },
    {},
  );
  logger.success();
  return boundGenerateScreenshots(bundleFile, logger);
}
