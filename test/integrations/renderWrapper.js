import React from 'react';

import ThemeContext from './theme';

export default function (component) {
  return <ThemeContext.Provider value="dark">{component}</ThemeContext.Provider>;
}
