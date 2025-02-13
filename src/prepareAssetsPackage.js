import fs from 'fs';
import path from 'path';

import findCSSAssetPaths from './findCSSAssetPaths';
import deterministicArchive from './deterministicArchive';

function makePackage({ paths, publicFolders }) {
  const publicFoldersResolved = publicFolders.map((folder) =>
    folder.startsWith('/') ? folder : path.resolve(process.cwd(), folder),
  );

  const files = Object.entries(paths).map(([assetPath, resolvePath]) => {
    if (!resolvePath) {
      throw new Error(`Unable to resolve asset path: ${assetPath}`);
    }

    for (const publicFolder of publicFoldersResolved) {
      const fullPath = path.join(publicFolder, assetPath);
      if (fs.existsSync(fullPath)) {
        return {
          content: fs.createReadStream(fullPath),
          name: resolvePath,
        };
      }

      // findCSSAssetPaths will sometimes return absolute paths
      if (assetPath.startsWith(publicFolder) && fs.existsSync(assetPath)) {
        return {
          content: fs.createReadStream(assetPath),
          name: resolvePath,
        };
      }

      // as a last fallback, check if the resolve path exists in the public
      // folder
      const fullResolvePath = path.join(publicFolder, resolvePath);
      if (fs.existsSync(fullResolvePath)) {
        return {
          content: fs.createReadStream(fullResolvePath),
          name: resolvePath,
        };
      }
    }

    return null;
  });

  return deterministicArchive([], files.filter(Boolean));
}

export default function prepareAssetsPackage({
  globalCSS,
  snapPayloads,
  publicFolders,
}) {
  const paths = {};

  globalCSS.forEach(({ css, source }) => {
    findCSSAssetPaths({ css, source }).forEach(({ assetPath, resolvePath }) => {
      paths[assetPath] = resolvePath;
    });
  });

  snapPayloads.forEach(({ assetPaths }) => {
    assetPaths.forEach((assetPath) => {
      paths[assetPath] = assetPath;
    });
  });

  return makePackage({ paths, publicFolders });
}
