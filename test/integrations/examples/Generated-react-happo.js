import React from 'react';

export default [
  {
    component: 'Generated',
    variants: {
      one: {
        render: () => <button>One</button>,
        stylesheets: ['one'],
        targets: ['chrome'],
      },
      two: {
        render: () => <button>Two</button>,
        stylesheets: ['two'],
      },
      three: () => <button>Three</button>,
      _four: () => <button>Four</button>,
      _ignored:
        'Build tools sometimes add extra exports. There are usually prefixed with an underscore',
      optedOut: {
        render: () => <button>Opted out</button>,
        targets: ['firefox'],
      },
      optedOutOfAll: {
        render: () => <button>Opted out</button>,
        targets: [],
      },
    },
  },
];
