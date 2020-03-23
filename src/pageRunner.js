import { performance } from 'perf_hooks';

import Logger from './Logger';
import constructReport from './constructReport';

export default async function pagesRunner(
  { apiKey, apiSecret, endpoint, targets, pages },
  { isAsync } = {},
) {
  const logger = new Logger();
  try {
    logger.info('Preparing job for remote execution...');
    const outerStartTime = performance.now();
    const targetNames = Object.keys(targets);
    const tl = targetNames.length;
    logger.info(`Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const startTime = performance.now();
        const result = await targets[name].execute({
          targetName: name,
          asyncResults: isAsync,
          pages,
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
    if (isAsync) {
      return results;
    }
    return constructReport(results);
  } catch (e) {
    logger.fail();
    throw e;
  }
}
