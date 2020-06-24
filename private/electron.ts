import path from 'path';
import server from './server';
import { Tray, app, dialog, } from 'electron';

let tray: Tray | null = null;

app.on('ready', () => {
  const $ = dialog.showOpenDialogSync({ properties: [ 'openDirectory', ], });

  if ($) {
    process.chdir(path.resolve($[0]));

    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    tray = new Tray(path.join(`${app.getAppPath()}/iconTemplate@2x.png`));

    tray.on('click', () => app.quit());

    server().listen(1337);
  }
});
