import React, { PureComponent } from 'react';
import styled from 'styled-components';

import { snap } from '../src';
import processSnap from '../src/processSnap';

const Title = styled.h1`
  transform: translateY(-10%);
  font-size: 1.5em;
  text-align: center;
  color: red;
`;

class Foo extends PureComponent {
  render() {
    return (
      <div className="foo">
        <Title>Test</Title>
      </div>
    );
  }
}

it('provides a serializable payload', () => {
  const snapshot = snap('foo', <Foo />);
  const payload = processSnap(snapshot);
  expect(payload.css).toMatch(/-webkit-transform:.*color:red;/);
  expect(payload.html).toMatch(/<div.*><h1.*>Test<\/h1>/);
});
