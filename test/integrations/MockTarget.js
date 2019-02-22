export default class MockTarget {
  constructor() {
    this.viewport = '800x600';
  }

  execute({ globalCSS, snapPayloads, staticPackage, assetsPackage, sha, targetName }) {
    this.globalCSS = globalCSS;
    this.snapPayloads = snapPayloads;
    this.staticPackage = staticPackage;
    this.assetsPackage = assetsPackage;
    this.sha = sha;
    this.targetName = targetName;
    return [];
  }
}
