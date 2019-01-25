import React from 'react';

export default [
  {
    component: 'Generated',
    variants: {
      one: {
        render: () => <button>One</button>,
        stylesheets: ['one.css'],
      },
      two: {
        render: () => <button>Two</button>,
        stylesheets: ['two.css'],
      },
      three: () => <button>Three</button>,
    },
  },
];
