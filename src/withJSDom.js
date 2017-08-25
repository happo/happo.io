import jsdomGlobal from 'jsdom-global';

export default function withJSDom(func) {
  const cleanupGlobals = jsdomGlobal();
  func();
  cleanupGlobals();
}
