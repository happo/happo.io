import inlineResources from './inlineResources';

const { VERBOSE = 'false' } = process.env;

export default async function processSnapsInBundle(
  webpackBundle,
  { publicFolders, viewport, DomProvider },
) {
  const [width, height] = viewport.split('x').map((s) => parseInt(s, 10));
  const domProvider = new DomProvider({
    webpackBundle,
    width,
    height,
  });

  const result = {
    snapPayloads: [],
  };
  try {
    await domProvider.init();

    // Disabling eslint here because we actually want to run things serially.
    /* eslint-disable no-await-in-loop */
    while (await domProvider.next()) {
      if (VERBOSE === 'true') {
        console.log(`Viewport ${viewport}`);
      }
      const payloads = await domProvider.processCurrent();
      payloads.forEach((payload) => {
        if (payload.html && publicFolders && publicFolders.length) {
          payload.html = inlineResources(payload.html, { publicFolders });
        }
      });
      result.snapPayloads.push(...payloads);
    }

    result.css = await domProvider.extractCSS();
  } catch (e) {
    throw e;
  } finally {
    await domProvider.close();
  }
  return result;
}
