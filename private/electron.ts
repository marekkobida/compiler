import path from 'path';
import server from './server';
import { Menu, MenuItem, Tray, app, } from 'electron';

let menu: Menu | null = null;
let tray: Tray | null = null;

process.chdir(path.resolve(app.getAppPath(), '../../../../'));

app.on('ready', () => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  menu = new Menu();

  tray = new Tray(path.join(`${app.getAppPath()}/iconTemplate@2x.png`));

  menu.append(new MenuItem({ click: () => app.quit(), label: 'Ukončiť', }));

  tray.setContextMenu(menu);

  server('').listen(1337);
});
