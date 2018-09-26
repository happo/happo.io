import RemoteBrowserTarget from '../src/RemoteBrowserTarget';

let viewport;
let subject;
let browserName;

beforeEach(() => {
  browserName = 'firefox';
  viewport = '400x300';
  subject = () => new RemoteBrowserTarget(browserName, { viewport });
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
  expect(subject).toThrowError('Invalid viewport width for the "edge" target (you provided 316). Smallest width it can handle is 400.');
});
