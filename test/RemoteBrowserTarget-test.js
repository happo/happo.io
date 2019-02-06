import RemoteBrowserTarget from '../src/RemoteBrowserTarget';
import makeRequest from '../src/makeRequest';

jest.mock('../src/makeRequest');

let viewport;
let subject;
let browserName;
let chunks;

beforeEach(() => {
  browserName = 'firefox';
  viewport = '400x300';
  chunks = 1;
  subject = () => new RemoteBrowserTarget(browserName, { viewport, chunks });
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
      Promise.resolve({ requestId: 44, status: 'done', result: [] }),
    );
  });

  describe('when chunks is equal to two', () => {
    beforeEach(() => {
      chunks = 2;
    });

    it('sends the right requests', async () => {
      const target = subject();
      await target.execute({
        globalCSS: '* { color: red }',
        snapPayloads: [{ html: '<div/>' }, { html: '<button/>' }, { html: '<li/>' }],
        apiKey: 'foobar',
        apiSecret: 'p@assword',
        endpoint: 'http://localhost',
      });

      // two POSTs and two GETs
      expect(makeRequest.mock.calls.length).toBe(4);

      expect(makeRequest.mock.calls[0][0].body.payload.snapPayloads).toEqual([
        { html: '<div/>' },
      ]);
      expect(makeRequest.mock.calls[2][0].body.payload.snapPayloads).toEqual([
        { html: '<button/>' },
        { html: '<li/>' },
      ]);
    });
  });

  describe('when chunks is equal to one', () => {
    beforeEach(() => {
      chunks = 1;
    });

    it('sends the right requests', async () => {
      const target = subject();
      await target.execute({
        globalCSS: '* { color: red }',
        snapPayloads: [{ html: '<div/>' }, { html: '<button/>' }, { html: '<li/>' }],
        apiKey: 'foobar',
        apiSecret: 'p@assword',
        endpoint: 'http://localhost',
      });

      // one POST and one GET
      expect(makeRequest.mock.calls.length).toBe(2);

      expect(makeRequest.mock.calls[0][0].body.payload.snapPayloads).toEqual([
        { html: '<div/>' },
        { html: '<button/>' },
        { html: '<li/>' },
      ]);
    });
  });
});
