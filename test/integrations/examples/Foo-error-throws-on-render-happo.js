import React from 'react';

function Throwing() {
  throw new Error('whoops, my bad');
}

export default () => <Throwing />;
