import Logger from './Logger';
import constructReport from './constructReport';

export default async function remoteRunner(
  { apiKey, apiSecret, endpoint, targets },
  { generateStaticPackage },
) {
  const logger = new Logger();
  try {
    logger.info('Generating static package...');
    const staticPackage = await generateStaticPackage();
    const targetNames = Object.keys(targets);
    const tl = targetNames.length;
    logger.info(`Generating screenshots in ${tl} target${tl > 1 ? 's' : ''}...`);
    const results = await Promise.all(
      targetNames.map(async (name) => {
        const result = await targets[name].execute({
          staticPackage,
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
