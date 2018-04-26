export default class MockTarget {
  constructor() {
    this.viewport = '800x600';
  }

  execute({ globalCSS, snapPayloads }) {
    this.globalCSS = globalCSS;
    this.snapPayloads = snapPayloads;
    return [];
  }
}
