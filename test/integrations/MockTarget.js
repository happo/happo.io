export default class MockTarget {
  constructor() {
    this.viewport = '800x600';
  }

  execute({ globalCSS, snapPayloads, staticPackage }) {
    this.globalCSS = globalCSS;
    this.snapPayloads = snapPayloads;
    this.staticPackage = staticPackage;
    return [];
  }
}
