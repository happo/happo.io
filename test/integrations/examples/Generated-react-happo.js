import React from 'react';

export default [
  {
    component: 'Generated',
    variants: {
      one: {
        render: () => <button type="button">One</button>,
        stylesheets: ['one'],
        targets: ['chrome', 'chromeSmall'],
      },
      two: {
        render: () => <button type="button">Two</button>,
        stylesheets: ['two'],
      },
      three: () => <button type="button">Three</button>,
      _four: () => <button type="button">Four</button>,
      _ignored:
        'Build tools sometimes add extra exports. There are usually prefixed with an underscore',
      optedOut: {
        render: () => <button type="button">Opted out</button>,
        targets: ['firefox'],
      },
      optedOutOfAll: {
        render: () => <button type="button">Opted out</button>,
        targets: [],
      },
    },
  },
];
