import getRenderFunc from './getRenderFunc';

export default function validateAndFilterExamples(examples) {
  for (const example of examples) {
    const variantKeys = Object.keys(example.variants);
    for (const variantKey of variantKeys) {
      const variant = example.variants[variantKey];
      const renderFunc = getRenderFunc(variant);
      if (!renderFunc) {
        if (variantKey.startsWith('_')) {
          delete example.variants[variantKey];
        } else {
          throw new Error(
            `Variant ${variantKey} in component ${
              example.component
            } has no render function\nFound in ${example.fileName}`,
          );
        }
      }
    }
  }
}
