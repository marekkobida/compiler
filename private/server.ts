import Compiler from './Compiler';
import StatisticsFile from './StatisticsFile';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';
import test from './test';
import { version, } from '../package.json';

function server (): http.Server {
  const l: number = +new Date();
  const r: number = 159624e7;

  if (l < r) {
    test('PUT');

    const compiler = new Compiler();

    const statisticsFile = new StatisticsFile();

    return http.createServer(async (request, response) => {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Content-Type', 'application/json; charset=utf-8');

      try {
        response.statusCode = 200;

        const requestedURL = new URL(request.url, `http://${request.headers.host}`);
        const requestedURLParameters = requestedURL.searchParams;

        if (requestedURL.pathname === '/about.json') {
          response.end(JSON.stringify({ version, }));

          return;
        }

        // Compiler

        const isCompilerCompileFunctionRequested = requestedURL.pathname === '/compiler/compile';
        const isCompilerInputFileRequested = requestedURL.pathname === `/compiler/${compiler.inputFile.fileName}`;
        const isCompilerOutputFileRequested = requestedURL.pathname === `/compiler/${compiler.outputFile.fileName}`;

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

        // Statistics

        const isStatisticsFileRequested = requestedURL.pathname === `/${statisticsFile.fileName}`;

        if (isStatisticsFileRequested) {
          const urlFromRequestedUrlParameters = requestedURLParameters.get('url');

          if (request.headers.referer && request.headers['user-agent'] && urlFromRequestedUrlParameters) {
            statisticsFile.$.requests = [
              {
                headers: [
                  [ 'referer', request.headers.referer, ],
                  [ 'user-agent', request.headers['user-agent'], ],
                ],
                url: new URL(urlFromRequestedUrlParameters).toString(),
              },
              ...statisticsFile.$.requests,
            ];

            statisticsFile.writeFile();
          }

          response.end(JSON.stringify(statisticsFile.$));

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
  }
}

export default server;
