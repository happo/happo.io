import React, { PureComponent } from 'react';
import styled from 'styled-components';

import { snap } from '../src';
import processSnap from '../src/processSnap';

describe('with styled-components', () => {
  it('provides a serializable payload', () => {
    const Title = styled.h1`
      transform: translateY(-10%);
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

    const snapshot = snap('foo', <Foo />);
    const payload = processSnap(snapshot);
    expect(payload.css).toMatch(/-webkit-transform:.*color:red;/);
    expect(payload.html).toMatch(/<div.*><h1.*>Test<\/h1>/);
  });
});

describe('with aphrodite', () => {
  // todo
});

describe('with css-loader through webpack', () => {
  // todo
  // this might help: https://www.npmjs.com/package/babel-plugin-webpack-loaders
});
