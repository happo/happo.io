const SUFFIX_PATTERN = /([\w-_]+)[-_]\w+\.jsx?$/;
const DIRECTORY_PATTERN = /([\w-_]+)\/\w+\.jsx?$/;

export default function getComponentNameFromFileName(fileName) {
  const match = fileName.match(SUFFIX_PATTERN) || fileName.match(DIRECTORY_PATTERN);
  if (!match) {
    // This is unexpected, but we can at least fall back to the file name.
    return fileName;
  }
  return match[1];
}
