import crypto from 'crypto';

export default function createHash(string) {
  return crypto.createHash('md5').update(string).digest('hex').substr(0, 5);
}
