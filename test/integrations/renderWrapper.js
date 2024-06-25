import React from 'react';

import ThemeContext from './theme';

export default function renderWrapper(component) {
  return <ThemeContext.Provider value="dark">{component}</ThemeContext.Provider>;
}
