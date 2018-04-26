import crypto from 'crypto';

export default function createHash(data) {
  return crypto
    .createHash('md5')
    .update(data)
    .digest('hex');
}
