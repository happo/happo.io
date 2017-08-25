import jsdomGlobal from 'jsdom-global';

import { snap } from './';

export default function withJSDom(func) {
  const cleanupGlobals = jsdomGlobal();
  global.enduire = { snap };
  func();
  cleanupGlobals();
}
