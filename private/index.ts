import Compiler from './Compiler';
import find from 'local-devices';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import p from '../package.json';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';
import webpack from 'webpack';

const l: number = +new Date();
const r: number = 159624e7;

if (l < r) {
  const compiler = new Compiler();

  const server = http.createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
      response.statusCode = 200;

      const requestedURL = new URL(`file://${request.url}`);
      const requestedURLParameters = requestedURL.searchParams;

      if (requestedURL.pathname === '/devices.json') {
        const devices = await find();

        response.end(JSON.stringify(devices.map((device) => device.ip)));

        return;
      }

      if (requestedURL.pathname === '/favicon.ico') {
        response.setHeader('Content-Type', 'image/x-icon');

        response.end();

        return;
      }

      const isCompileFunctionRequested
        = requestedURL.pathname === '/compiler/compile';
      const isInputFileRequested
        = requestedURL.pathname === `/${compiler.inputFile.fileName}`;
      const isOutputFileRequested
        = requestedURL.pathname === `/${compiler.outputFile.fileName}`;
      const isStatisticsFileRequested
        = requestedURL.pathname === `/${compiler.statisticsFile.fileName}`;

      if (isCompileFunctionRequested) {
        const pathFromRequestedURLParameters = requestedURLParameters.get('path');

        if (pathFromRequestedURLParameters) {
          await compiler.compile(pathFromRequestedURLParameters);

          response.end();

          return;
        }
      }

      if (isInputFileRequested) {
        response.end(JSON.stringify(await compiler.inputFile.readFile()));

        return;
      }

      if (isOutputFileRequested) {
        response.end(JSON.stringify(await compiler.outputFile.readFile()));

        return;
      }

      if (isStatisticsFileRequested) {
        const statisticsFile = await compiler.statisticsFile.readFile();

        const urlFromRequestedUrlParameters = requestedURLParameters.get('url');

        if (request.headers.referer && request.headers['user-agent'] && urlFromRequestedUrlParameters) {
          statisticsFile.requests = [
            {
              headers: {
                referer: request.headers.referer,
                'user-agent': request.headers['user-agent'],
              },
              ip: response.socket.remoteAddress,
              url: new URL(urlFromRequestedUrlParameters).toString(),
            },
            ...statisticsFile.requests,
          ];

          compiler.statisticsFile.writeFile(statisticsFile);

          response.end();

          return;
        }

        response.end(JSON.stringify(statisticsFile));

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

  server.listen(1337, () => process.stdout.write(`\x1b[31m       x  x\n    x        x\n   x          x\n   x          x\n    x        x\n       x  x\x1b[0m\n\n     ${p.name}\n     ${p.version}\n\n     webpack\n     ${webpack.version}\n\n`));
}
