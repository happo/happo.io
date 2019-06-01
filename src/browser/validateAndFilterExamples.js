import getRenderFunc from './getRenderFunc';

export default function validateAndFilterExamples(examples, { targetName }) {
  return examples
    .map((example) => {
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
          `Variant ${example.variant} in component ${
            example.component
          } has no render function\nFound in ${example.fileName}`,
        );
      }
      return example;
    })
    .filter(Boolean);
}
