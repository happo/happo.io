import RemoteBrowserTarget from '../src/RemoteBrowserTarget';
import makeRequest from '../src/makeRequest';

jest.mock('../src/makeRequest');

let viewport;
let subject;
let browserName;
let chunks;
let renderingOptions;

beforeEach(() => {
  browserName = 'firefox';
  viewport = '400x300';
  chunks = 1;
  renderingOptions = undefined;
  subject = () =>
    new RemoteBrowserTarget(browserName, { viewport, chunks, renderingOptions });
});

it('does not fail', () => {
  expect(subject).not.toThrow();
});

it('validates viewports', () => {
  viewport = '400x500px';
  expect(subject).toThrowError(/Invalid viewport "400x500px"/);
});

it('finds viewports that cause issues for internet explorer', () => {
  viewport = '316x500';
  browserName = 'edge';
  expect(subject).toThrowError(
    'Invalid viewport width for the "edge" target (you provided 316). Smallest width it can handle is 400.',
  );
});

describe('#execute', () => {
  beforeEach(() => {
    makeRequest.mockReset();
    makeRequest.mockImplementation(() =>
      Promise.resolve({
        requestId: 44,
        status: 'done',
        result: [
          {
            component: 'foobar',
          },
        ],
      }),
    );
  });

  describe('with renderingOptions', () => {
    beforeEach(() => {
      renderingOptions = { foobar: true };
    });

    it('passes along the renderingOptions', async () => {
      const target = subject();
      await target.execute({
        globalCSS: '* { color: red }',
        snapPayloads: [{ html: '<div/>' }, { html: '<button/>' }, { html: '<li/>' }],
        apiKey: 'foobar',
        apiSecret: 'p@assword',
        endpoint: 'http://localhost',
      });
      expect(makeRequest.mock.calls[0][0].body.payload.renderingOptions).toEqual({
        foobar: true,
      });
    });
  });

  describe('when chunks is equal to two', () => {
    beforeEach(() => {
      chunks = 2;
    });

    it('sends the right requests', async () => {
      const target = subject();
      const result = await target.execute({
        globalCSS: '* { color: red }',
        snapPayloads: [{ html: '<div/>' }, { html: '<button/>' }, { html: '<li/>' }],
        apiKey: 'foobar',
        apiSecret: 'p@assword',
        endpoint: 'http://localhost',
      });

      expect(result).toEqual([
        { component: 'foobar', snapRequestId: 44 },
        { component: 'foobar', snapRequestId: 44 },
      ]);

      // two POSTs and two GETs
      expect(makeRequest.mock.calls.length).toBe(4);

      expect(makeRequest.mock.calls[0][0].body.payload.snapPayloads).toEqual([
        { html: '<div/>' },
        { html: '<button/>' },
      ]);
      expect(makeRequest.mock.calls[2][0].body.payload.snapPayloads).toEqual([
        { html: '<li/>' },
      ]);
    });

    describe('with a staticPackage', () => {
      it('sends the right requests', async () => {
        const target = subject();
        const result = await target.execute({
          globalCSS: '* { color: red }',
          apiKey: 'foobar',
          apiSecret: 'p@assword',
          endpoint: 'http://localhost',
          staticPackage: 'foobar',
        });

        expect(result).toEqual([
          { component: 'foobar', snapRequestId: 44 },
          { component: 'foobar', snapRequestId: 44 },
        ]);

        // two POSTs and two GETs
        expect(makeRequest.mock.calls.length).toBe(4);

        expect(makeRequest.mock.calls[0][0].body.payload.staticPackage).toEqual(
          'foobar',
        );
        expect(makeRequest.mock.calls[0][0].body.payload.chunk).toEqual({
          index: 0,
          total: 2,
        });
        expect(makeRequest.mock.calls[2][0].body.payload.chunk).toEqual({
          index: 1,
          total: 2,
        });
      });
    });
  });

  describe('when chunks is equal to one', () => {
    beforeEach(() => {
      chunks = 1;
    });

    it('sends the right requests', async () => {
      const target = subject();
      const result = await target.execute({
        globalCSS: '* { color: red }',
        snapPayloads: [{ html: '<div/>' }, { html: '<button/>' }, { html: '<li/>' }],
        apiKey: 'foobar',
        apiSecret: 'p@assword',
        endpoint: 'http://localhost',
      });

      expect(result).toEqual([{ component: 'foobar', snapRequestId: 44 }]);

      // one POST and one GET
      expect(makeRequest.mock.calls.length).toBe(2);

      expect(makeRequest.mock.calls[0][0].body.payload.snapPayloads).toEqual([
        { html: '<div/>' },
        { html: '<button/>' },
        { html: '<li/>' },
      ]);
    });

    describe('when there are no snapPayloads (as in happo-plugin-storybook)', () => {
      it('sends just one request', async () => {
        const target = subject();
        const result = await target.execute({
          globalCSS: '* { color: red }',
          apiKey: 'foobar',
          apiSecret: 'p@assword',
          endpoint: 'http://localhost',
          staticPackage: 'foobar',
        });

        expect(result).toEqual([{ component: 'foobar', snapRequestId: 44 }]);

        // one POST and one GET
        expect(makeRequest.mock.calls.length).toBe(2);

        expect(makeRequest.mock.calls[0][0].body.payload.staticPackage).toEqual(
          'foobar',
        );
      });
    });
  });

  [2049, 7296, 7297].forEach((count) => {
    describe(`with ${count} snapshots`, () => {
      let seenSnapshots;

      beforeEach(() => {
        seenSnapshots = new Set();
        chunks = 16;

        makeRequest.mockImplementation(({ body }) => {
          if (body) {
            const snaps = body.payload.snapPayloads;
            snaps.forEach(({ html }) => {
              seenSnapshots.add(html);
            });
          }
          return Promise.resolve({
            requestId: 44,
            status: 'done',
            result: [],
          });
        });
      });

      it('processes the right requests', async () => {
        const target = subject();
        const snaps = Array(count)
          .fill()
          .map((_, i) => ({
            html: `snap-${i}`,
          }));
        await target.execute({
          globalCSS: '* { color: red }',
          snapPayloads: snaps,
          apiKey: 'foobar',
          apiSecret: 'p@assword',
          endpoint: 'http://localhost',
        });

        expect(seenSnapshots.size).toEqual(count);
        expect(makeRequest.mock.calls.length).toBe(32);
      });
    });
  });
});
