import Compiler from './Compiler';
import StatisticsFile from './StatisticsFile';
import find from 'local-devices';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import p from '../package.json';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';
import readline from 'readline';
import webpack from 'webpack';

const l: number = +new Date();
const r: number = 159624e7;

if (l < r) {
  const i = readline.createInterface({ input: process.stdin, output: process.stdout, });

  i.question('Name? ', (name) => {
    const compiler = new Compiler();

    const statisticsFile = new StatisticsFile();

    const server = http.createServer(async (request, response) => {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Content-Type', 'application/json; charset=utf-8');

      try {
        response.statusCode = 200;

        const requestedURL = new URL(request.url, `http://${request.headers.host}`);
        const requestedURLParameters = requestedURL.searchParams;

        if (requestedURL.pathname === '/about') {
          response.end(JSON.stringify({ name, version: p.version, }));

          return;
        }

        if (requestedURL.pathname === '/devices.json') {
          response.end(JSON.stringify((await find()).map((device) => device.ip)));

          return;
        }

        if (requestedURL.pathname === '/favicon.ico') {
          response.setHeader('Content-Type', 'image/x-icon');

          response.end();

          return;
        }

        // Statistics
        const isStatisticsFileRequested = requestedURL.pathname === `/${statisticsFile.fileName}`;

        if (isStatisticsFileRequested) {
          const urlFromRequestedUrlParameters = requestedURLParameters.get('url');

          if (request.headers.referer && request.headers['user-agent'] && urlFromRequestedUrlParameters) {
            statisticsFile.$.requests = [
              {
                headers: {
                  referer: request.headers.referer,
                  'user-agent': request.headers['user-agent'],
                },
                url: new URL(urlFromRequestedUrlParameters).toString(),
              },
              ...statisticsFile.$.requests,
            ];

            statisticsFile.writeFile();
          }

          response.end(JSON.stringify(statisticsFile.$));

          return;
        }

        // Compiler
        const isCompilerCompileFunctionRequested = requestedURL.pathname === '/compiler/compile';
        const isCompilerInputFileRequested = requestedURL.pathname === `/${compiler.inputFile.fileName}`;
        const isCompilerOutputFileRequested = requestedURL.pathname === `/${compiler.outputFile.fileName}`;

        if (isCompilerCompileFunctionRequested) {
          const pathFromRequestedURLParameters = requestedURLParameters.get('path');

          if (pathFromRequestedURLParameters) {
            await compiler.compile(pathFromRequestedURLParameters);

            response.end();

            return;
          }
        }

        if (isCompilerInputFileRequested) {
          response.end(JSON.stringify(compiler.inputFile.$));

          return;
        }

        if (isCompilerOutputFileRequested) {
          response.end(JSON.stringify(compiler.outputFile.$));

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

    i.close();
  });
}
