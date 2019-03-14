export default function getRenderFunc(variant) {
  if (typeof variant === 'function') {
    return variant;
  }
  return variant.render;
}
