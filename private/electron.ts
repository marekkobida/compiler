import electronPath from './electronPath';
import path from 'path';
import server from './server';
import { Menu, MenuItem, Tray, app, ipcMain, } from 'electron';

let menu: Menu | null = null;
let tray: Tray | null = null;

process.chdir(electronPath());

app.on('ready', () => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  menu = new Menu();

  tray = new Tray(path.join(`${app.getAppPath()}/iconTemplate@2x.png`));

  menu.append(new MenuItem({ click: () => app.quit(), label: 'Ukončiť', }));

  tray.setContextMenu(menu);

  ipcMain.on('startServer', async (event, name) => {
    server(name, '3.0.1').listen(1337);
  });
});
