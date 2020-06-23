import electronPath from './electronPath';
import path from 'path';
import server from './server';
import { BrowserWindow, Menu, MenuItem, Tray, app, ipcMain, } from 'electron';

const WINDOW_HEIGHT = 256;
const WINDOW_WIDTH = 256;

let browserWindow: BrowserWindow | null = null;
let menu: Menu | null = null;
let tray: Tray | null = null;

process.chdir(electronPath());

app.on('ready', () => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  browserWindow = new BrowserWindow({
    frame: false,
    height: WINDOW_HEIGHT,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
    width: WINDOW_WIDTH,
  });

  browserWindow.loadURL(`file://${app.getAppPath()}/index.html`);

  browserWindow.on('blur', browserWindow.hide);

  browserWindow.on('close', () => browserWindow = null);

  menu = new Menu();

  tray = new Tray(path.join(`${app.getAppPath()}/iconTemplate@2x.png`));

  menu.append(new MenuItem({ click: () => app.quit(), label: 'Ukončiť', }));

  tray.setContextMenu(menu);

  ipcMain.on('startServer', async (event, name) => {
    server(name, '3.0.0').listen(1337);
  });
});
