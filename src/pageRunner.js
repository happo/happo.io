import Logger, { logTag } from './Logger';
import constructReport from './constructReport';

export default async function pagesRunner(
  { apiKey, apiSecret, endpoint, targets, pages, project },
  { isAsync } = {},
) {
  const logger = new Logger();

  try {
    logger.info(`${logTag(project)}Preparing job for remote execution...`);
    const outerStartTime = Date.now();
    const targetNames = Object.keys(targets);
    const tl = targetNames.length;
    logger.info(`${logTag(project)}Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const startTime = Date.now();
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
