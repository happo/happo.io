import Jimp from 'jimp';

const MAX_EUCLIDEAN_DISTANCE = Math.sqrt(255 ** 2 * 4);

function makeAbsolute(url, endpoint) {
  if (url.startsWith('http')) {
    return url;
  }
  return `${endpoint}${url}`;
}

function euclideanDistance(rgba1, rgba2) {
  return Math.sqrt(
    (rgba1[0] - rgba2[0]) ** 2 +
      (rgba1[1] - rgba2[1]) ** 2 +
      (rgba1[2] - rgba2[2]) ** 2 +
      (rgba1[3] - rgba2[3]) ** 2,
  );
}

function imageDiff(bitmap1, bitmap2) {
  let total = 0;
  const len = bitmap1.width * bitmap1.height * 4;
  for (let i = 0; i < len; i += 4) {
    total +=
      euclideanDistance(
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
      ) / MAX_EUCLIDEAN_DISTANCE;
  }
  return total / (len / 4);
}

export default async function compareSnapshots({ before, after, endpoint }) {
  const [image1, image2] = await Promise.all([
    Jimp.read(makeAbsolute(before.url, endpoint)),
    Jimp.read(makeAbsolute(after.url, endpoint)),
  ]);

  return imageDiff(image1.bitmap, image2.bitmap);
}
