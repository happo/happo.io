import getRenderFunc from './getRenderFunc';

export default function validateAndFilterExamples(examples) {
  return examples
    .map((example) => {
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
