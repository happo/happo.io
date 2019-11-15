import Jimp from 'jimp';
import colorDelta from 'lcs-image-diff/src/colorDelta';

function makeAbsolute(url, endpoint) {
  if (url.startsWith('http')) {
    return url;
  }
  return `${endpoint}${url}`;
}

function imageDiff({ bitmap1, bitmap2, compareThreshold }) {
  const len = bitmap1.width * bitmap1.height * 4;
  for (let i = 0; i < len; i += 4) {
    const distance =
      colorDelta(
        [
          bitmap1.data[i],
          bitmap1.data[i + 1],
          bitmap1.data[i + 2],
          bitmap1.data[i + 3],
        ],
        [
          bitmap2.data[i],
          bitmap2.data[i + 1],
          bitmap2.data[i + 2],
          bitmap2.data[i + 3],
        ],
      );
    if (distance > compareThreshold) {
      return distance;
    }
  }
}

export default async function compareSnapshots({
  before,
  after,
  endpoint,
  compareThreshold,
}) {
  if (before.height !== after.height || before.width !== after.width) {
    return 1;
  }
  const [image1, image2] = await Promise.all([
    Jimp.read(makeAbsolute(before.url, endpoint)),
    Jimp.read(makeAbsolute(after.url, endpoint)),
  ]);

  return imageDiff({
    bitmap1: image1.bitmap,
    bitmap2: image2.bitmap,
    compareThreshold,
  });
}
