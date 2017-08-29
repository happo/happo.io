import createHash from './createHash';
import extractCSS from './extractCSS';
import processSnap from './processSnap';
import withJSDom from './withJSDom';

export default function processSnapsInBundle(webpackBundle) {
  return new Promise((resolve) => {
    withJSDom(() => {
      // Parse and execute the webpack bundle in a jsdom environment
      require(webpackBundle);

      const result = {
        globalCSS: extractCSS(),
        snapPayloads: [],
      };

      Object.keys(global.snaps).forEach(file => {
        console.log(`Processing ${file}`);
        Object.keys(global.snaps[file]).forEach(name => {
          const hash = createHash(`${file}|${name}`);
          console.log(`  - ${name} | http://localhost:2999/${hash}`);
          withJSDom(() => {
            result.snapPayloads.push(
              Object.assign({}, processSnap(global.snaps[file][name]), {
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
