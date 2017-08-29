import path from 'path';

import express from 'express';

export default class PreviewServer {
  constructor() {
    this.app = express();
    this.snaps = {};
    this.setupRoutes();
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));
  }

  getSnapPayload(hash) {
    return this.snaps.snapPayloads.find(({ hash: h }) => h === hash);
  }

  setupRoutes() {
    this.app.get('/:hash', ({ params: { hash } }, res) => {
      const snap = this.getSnapPayload(hash);
      if (!snap) {
        res.status(404).send(`Snap ${hash} not found.`);
        return;
      }

      res.render(
        'preview.ejs',
        Object.assign(
          {
            globalCSS: this.snaps.globalCSS,
          },
          snap,
        ),
      );
    });
  }

  start() {
    this.app.listen(2999);
  }

  updateSnaps(snaps) {
    this.snaps = snaps;
  }
}
