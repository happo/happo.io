import Logger from './Logger';
import constructReport from './constructReport';

export default async function pagesRunner({
  apiKey,
  apiSecret,
  endpoint,
  targets,
  pages,
}) {
  const logger = new Logger();
  try {
    logger.info('Preparing job for remote execution...');
    const targetNames = Object.keys(targets);
    const tl = targetNames.length;
    logger.info(`Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const result = await targets[name].execute({
          pages,
          apiKey,
          apiSecret,
          endpoint,
        });
        logger.start(`  - ${name}`);
        logger.success();
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
