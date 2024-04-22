import validateArchive from '../src/validateArchive';

describe('validateArchive', () => {
  let totalBytes;
  let entries;
  let subject;

  beforeEach(() => {
    totalBytes = 100;
    entries = [];
    subject = () => validateArchive(totalBytes, entries);
  });

  it('does not throw when totalBytes is lower than 30 MB', () => {
    expect(subject()).toBe(undefined);
  });

  describe('when the size is larger than 60 MB', () => {
    beforeEach(() => {
      totalBytes = 73 * 1024 * 1024 + 2346;
      entries = [
        { name: 'rar.png', stats: { size: 95000000 } }, // inside stats object
        { name: 'dar.png', stats: { size: 78000000 } },
        { name: 'foo.png', size: 98000000 }, // outside stats object
        { name: 'bar.png', stats: { size: 8000000 } },
        { name: 'scar.png', size: 88000000 },
        { name: 'car.png' }, // no size
      ];
    });

    it('throws an error with a list of sorted files by size', () => {
      expect(subject).toThrow(
        /Package size is 73 MB.*maximum is 60 MB.*foo.png: 93 MB.*rar.png: 91 MB.*scar.png: 84 MB/s,
      );
    });
  });
});
