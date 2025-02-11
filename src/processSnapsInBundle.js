const { VERBOSE = 'false' } = process.env;

export default async function processSnapsInBundle(
  webpackBundle,
  { viewport, DomProvider, targetName },
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
    await domProvider.init({ targetName });

    while (await domProvider.next()) {
      if (VERBOSE === 'true') {
        console.log(`Viewport ${viewport}`);
      }
      const payload = await domProvider.processCurrent();
      result.snapPayloads.push(payload);
    }

    result.css = await domProvider.extractCSS();
  } finally {
    await domProvider.close();
  }
  return result;
}
