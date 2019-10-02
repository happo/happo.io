export default function stripQueryString(url) {
  return url.replace(/[?#].*$/, '');
}
