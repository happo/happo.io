import crypto from 'crypto';

export default function generateDevSha() {
  return `dev-${crypto.randomBytes(10).toString('hex')}`;
}
