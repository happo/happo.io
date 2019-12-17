import Logger from './Logger';
import constructReport from './constructReport';
import findTestFiles from './findTestFiles';
import getComponentNameFromFileName from './getComponentNameFromFileName';
import prepareAssetsPackage from './prepareAssetsPackage';

export default async function stringRunner({
  apiKey,
  apiSecret,
  include,
  endpoint,
  targets,
  publicFolders,
}) {
  const outerStartTime = performance.now();
  const logger = new Logger();
  logger.start('Searching for happo test files...');
  const files = await findTestFiles(include);
  logger.success(`${files.length} found`);

  const snapPayloads = [];
  const cssBlocks = [];
  files.forEach((file) => {
    const variants = require(file); // eslint-disable-line
    const component = getComponentNameFromFileName(file);
    Object.keys(variants).forEach((variant) => {
      const func = variants[variant];
      const { html, css } = func();
      snapPayloads.push({ component, variant, html, css });
      cssBlocks.push(css);
    });
  });

  const assetsPackage = await prepareAssetsPackage({
    globalCSS: cssBlocks,
    publicFolders,
    snapPayloads,
  });

  const targetNames = Object.keys(targets);
  const tl = targetNames.length;
  logger.info(`Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
  const results = await Promise.all(
    targetNames.map(async (name) => {
      const startTime = performance.now();
      const result = await targets[name].execute({
        assetsPackage,
        globalCSS: cssBlocks,
        snapPayloads,
        apiKey,
        apiSecret,
        endpoint,
      });
      logger.start(`  - ${name}`, { startTime });
      logger.success();
      return { name, result };
    }),
  );
  logger.start(undefined, { startTime: outerStartTime });
  logger.success();
  return constructReport(results);
}
