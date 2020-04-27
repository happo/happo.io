export default class MockTarget {
  constructor({ viewport } = {}) {
    this.viewport = viewport || '800x600';
  }

  execute({ globalCSS, snapPayloads, staticPackage, assetsPackage }) {
    this.globalCSS = globalCSS;
    this.snapPayloads = snapPayloads;
    this.staticPackage = staticPackage;
    this.assetsPackage = assetsPackage;
    return [];
  }
}
