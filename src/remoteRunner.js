import { performance } from 'perf_hooks';

import Logger from './Logger';
import constructReport from './constructReport';
import loadCSSFile from './loadCSSFile';

export default async function remoteRunner(
  { apiKey, apiSecret, endpoint, targets, plugins, stylesheets },
  { generateStaticPackage },
) {
  const logger = new Logger();
  try {
    logger.info('Generating static package...');
    const staticPackage = await generateStaticPackage();
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
          staticPackage,
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
    return constructReport(results);
  } catch (e) {
    logger.fail();
    throw e;
  }
}
