import createHash from './createHash';
import extractCSS from './extractCSS';
import processSnap from './processSnap';
import withJSDom from './withJSDom';

export default function processSnapsInBundle(webpackBundle, { globalCSS }) {
  return new Promise((resolve) => {
    withJSDom(() => {
      // Parse and execute the webpack bundle in a jsdom environment
      require(webpackBundle);

      const result = {
        globalCSS: globalCSS + extractCSS(),
        snapPayloads: [],
      };

      Object.keys(global.snaps).forEach(file => {
        console.log(`Processing ${file}`);
        Object.keys(global.snaps[file]).forEach(name => {
          const hash = createHash(`${file}|${name}`);
          const renderFunc = global.snaps[file][name];
          if (typeof renderFunc !== 'function') {
            // Some babel loaders add additional properties to the exports.
            // Ignore those that aren't functions.
            return;
          }
          console.log(`  - ${name} | http://localhost:2999/${hash}`);
          withJSDom(() => {
            result.snapPayloads.push(
              Object.assign({}, processSnap(renderFunc), {
                file,
                name,
                hash,
              })
            );
          });
        });
      });
      resolve(result);
    });
  });
}
