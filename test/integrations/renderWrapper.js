import React from 'react';

import ThemeContext from './theme';

export default component => (
  <ThemeContext.Provider value="dark">
    {component}
  </ThemeContext.Provider>
);
