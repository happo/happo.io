import deterministicArchive from './deterministicArchive';

// We're setting the creation date to the same for all files so that the zip
// packages created for the same content ends up having the same fingerprint.
const FILE_CREATION_DATE = new Date('Fri Feb 08 2019 13:31:55 GMT+0100 (CET)');

const IFRAME_CONTENT = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Happo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <script src="happo-bundle.js"></script>
  </body>
</html>
`;

/**
 * Creates a static package of the given files
 *
 * @param {Object} options
 * @param {string} options.tmpdir
 * @param {string[]} options.publicFolders
 * @returns {Promise<{buffer: Buffer, hash: string}>}
 */
export default async function createStaticPackage({ tmpdir, publicFolders }) {
  const cwd = process.cwd();
  const filteredPublicFolders = publicFolders.filter((folder) =>
    folder.startsWith(cwd),
  );
  const uniqueDirs = Array.from(new Set([tmpdir, ...filteredPublicFolders]));

  return deterministicArchive(uniqueDirs, [
    {
      name: 'iframe.html',
      content: IFRAME_CONTENT,
    },
  ]);
}

export { FILE_CREATION_DATE };
