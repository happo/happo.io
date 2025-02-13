import { Writable } from 'stream';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import Archiver from 'archiver';

import validateArchive from './validateArchive';

// We're setting the creation date to the same for all files so that the zip
// packages created for the same content ends up having the same fingerprint.
const FILE_CREATION_DATE = new Date('Fri Feb 08 2019 13:31:55 GMT+0100 (CET)');

/**
 * Resolves all files in a directory and all of its subdirectories
 *
 * @param {string} dirOrFile
 * @returns {Promise<Array<{name: string, stream: ReadableStream}>>}
 */
async function resolveFilesRecursiveForDir(dirOrFile) {
  const resolvedDirOrFile = path.resolve(dirOrFile);
  const isDir = (await fs.promises.lstat(resolvedDirOrFile)).isDirectory();

  if (isDir) {
    const files = await fs.promises.readdir(resolvedDirOrFile, {
      withFileTypes: true,
      recursive: true,
    });

    return files
      .filter((dirent) => dirent.isFile())
      .map((dirent) => {
        const fullPath = path.join(dirent.path, dirent.name);
        return {
          name: fullPath.slice(resolvedDirOrFile.length + 1),
          stream: fs.createReadStream(fullPath),
        };
      });
  }

  return [
    {
      name: path.basename(resolvedDirOrFile),
      stream: fs.createReadStream(resolvedDirOrFile),
    },
  ];
}

/**
 * Resolves all files in all directories recursively
 *
 * @param {...string} dirsAndFiles
 * @returns {Promise<Array<{name: string, stream: ReadableStream }>>}
 */
async function resolveFilesRecursive(...dirsAndFiles) {
  const files = await Promise.all(
    dirsAndFiles.filter(Boolean).map(resolveFilesRecursiveForDir),
  );

  return files.flat();
}

/**
 * Creates a deterministic archive of the given files
 *
 * @param {string[]} dirsAndFiles
 * @param {{name: string, content: string}[]} contentToArchive
 * @returns {Promise<{buffer: Buffer, hash: string}>}
 */
export default async function deterministicArchive(
  dirsAndFiles,
  contentToArchive = [],
) {
  const uniqueDirsAndFiles = Array.from(new Set(dirsAndFiles));

  // Sort by name to make the output deterministic
  const filesToArchiveSorted = (
    await resolveFilesRecursive(...uniqueDirsAndFiles)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const contentToArchiveSorted = contentToArchive.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return new Promise((resolve, reject) => {
    const archive = new Archiver('zip', {
      // Concurrency in the stat queue leads to non-deterministic output.
      // https://github.com/archiverjs/node-archiver/issues/383#issuecomment-2253139948
      statConcurrency: 1,
      zlib: { level: 6 },
    });

    const stream = new Writable();
    const data = [];

    stream._write = (chunk, _enc, done) => {
      data.push(...chunk);
      done();
    };

    const entries = [];
    archive.on('entry', (entry) => {
      entries.push(entry);
    });

    stream.on('finish', () => {
      validateArchive(archive.pointer(), entries);
      const buffer = Buffer.from(data);
      const hash = crypto.createHash('md5').update(buffer).digest('hex');

      resolve({ buffer, hash });
    });
    archive.pipe(stream);

    const seenFiles = new Set();

    // We can't use archive.directory() here because it is not deterministic.
    // https://github.com/archiverjs/node-archiver/issues/383#issuecomment-2252938075
    for (const file of filesToArchiveSorted) {
      if (!seenFiles.has(file.name)) {
        archive.append(file.stream, {
          name: file.name,
          prefix: '',
          date: FILE_CREATION_DATE,
        });
        seenFiles.add(file.name);
      }
    }

    for (const file of contentToArchiveSorted) {
      if (!seenFiles.has(file.name)) {
        archive.append(file.content, {
          name: file.name,
          prefix: '',
          date: FILE_CREATION_DATE,
        });
        seenFiles.add(file.name);
      }
    }

    archive.on('error', reject);
    archive.finalize();
  });
}
