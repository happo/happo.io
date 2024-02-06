import getRenderFunc from './getRenderFunc';

export default function validateAndFilterExamples(
  examples,
  { targetName, only, chunk },
) {
  const all = examples
    .map((example) => {
      if (
        only &&
        (only.component !== example.component || only.variant !== example.variant)
      ) {
        // Not part of this run
        return undefined;
      }
      if (
        example.render &&
        Array.isArray(example.render.targets) &&
        !example.render.targets.includes(targetName)
      ) {
        // Example has a list of targets defined and the current target isn't
        // part of that list. Filter it out.
        return undefined;
      }
      const renderFunc = getRenderFunc(example.render);
      if (!renderFunc) {
        if (example.variant.startsWith('_')) {
          return undefined;
        }
        throw new Error(
          `Variant ${example.variant} in component ${example.component} has no render function\nFound in ${example.fileName}`,
        );
      }
      return example;
    })
    .filter(Boolean);

  if (only) {
    // Don't apply chunk filtering if rendering a single example.
    return all;
  }
  if (!chunk) {
    return all;
  }
  const examplesPerChunk = Math.ceil(all.length / chunk.total);
  const startIndex = chunk.index * examplesPerChunk;
  const endIndex = startIndex + examplesPerChunk;
  return all.slice(startIndex, endIndex);
}
