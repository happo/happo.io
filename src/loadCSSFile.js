import request from 'request-promise-native';

export default function loadCSSFile(cssFile) {
  return request(cssFile);
}
