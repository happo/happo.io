export default function getRenderFunc(variant) {
  if (typeof variant === 'undefined' || variant === null) {
    return undefined;
  }
  if (typeof variant === 'function') {
    return variant;
  }
  return variant.render;
}
