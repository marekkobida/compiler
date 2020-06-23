import path from 'path';
import { app, } from 'electron';

function electronPath () {
  return path.resolve(app.getAppPath(), '../../../../');
}

export default electronPath;
