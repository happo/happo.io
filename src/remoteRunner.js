import Logger from './Logger';
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
    logger.info(`Starting ${tl} target${tl > 1 ? 's' : ''}...`);
    const uniqueRequestIds = new Set();
    await Promise.all(
      targetNames.map(async (name) => {
        const requestIds = await targets[name].execute({
          staticPackage,
          apiKey,
          apiSecret,
          endpoint,
          globalCSS: cssBlocks.join('').replace(/\n/g, ''),
        });
        logger.start(`  - ${name}`);
        logger.success();
        requestIds.push((id) => uniqueRequestIds.add(id));
      }),
    );
    logger.success();
    return Array.from(uniqueRequestIds);
  } catch (e) {
    logger.fail();
    throw e;
  }
}
