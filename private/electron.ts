import path from 'path';
import server from './server';
import { Menu, MenuItem, Tray, app, dialog, } from 'electron';

let menu: Menu | null = null;
let tray: Tray | null = null;

app.on('ready', () => {
  const $ = dialog.showOpenDialogSync({ properties: [ 'openDirectory', ], });

  if ($) {
    process.chdir(path.resolve($[0]));

    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    menu = new Menu();

    tray = new Tray(path.join(`${app.getAppPath()}/iconTemplate@2x.png`));

    menu.append(new MenuItem({ click: () => app.quit(), label: 'Ukončiť', }));

    tray.setContextMenu(menu);

    server('').listen(1337);
  }
});
