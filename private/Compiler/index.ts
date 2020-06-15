import compilerServer from './compilerServer';
import find from 'local-devices';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import p from '../../package.json';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';
import readline from 'readline';
import webpack from 'webpack';

const l: number = +new Date();
const r: number = 159624e7;

if (l < r) {
  const i = readline.createInterface({ input: process.stdin, output: process.stdout, });

  i.question('Name? ', (name) => {
    const $ = http.createServer(async (request, response) => {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Content-Type', 'application/json; charset=utf-8');

      try {
        response.statusCode = 200;

        const requestedURL = new URL(request.url, `http://${request.headers.host}`);

        if (requestedURL.pathname === '/about.json') {
          response.end(JSON.stringify({ name, version: p.version, }));

          return;
        }

        if (requestedURL.pathname === '/devices.json') {
          response.end(JSON.stringify((await find()).map((device) => device.ip)));

          return;
        }

        const $ = mime(path.extname(requestedURL.pathname));

        response.setHeader('Content-Type', $.charset ? `${$.typeName}; charset=${$.charset}` : $.typeName);

        response.end(await readFile(`.${requestedURL.pathname}`, 'base64'), 'base64');
      } catch (error) {
        response.statusCode = 500;

        response.end(JSON.stringify({ errors: [ error.message, ], }));
      }
    });

    $.listen(1337);

    process.stdout.write(`\x1b[31m       x  x\n    x        x\n   x          x\n   x          x\n    x        x\n       x  x\x1b[0m\n\n      redred\n\n      ${p.name}\n      ${p.version}\n\n      webpack\n      ${webpack.version}\n\n`);

    i.close();
  });

  compilerServer.listen(1338);
}
