import Compiler from './Compiler';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';

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

      if (requestedURL.pathname === '/favicon.ico') {
        response.setHeader('Content-Type', 'image/x-icon');

        response.end();

        return;
      }

      const isCompilerCompileFunctionRequested
        = request.method === 'GET' && requestedURL.pathname === '/compiler/compile';
      const isCompilerInputFileRequested
        = request.method === 'GET' && requestedURL.pathname === `/${compiler.inputFile.fileName}`;
      const isCompilerOutputFileRequested
        = request.method === 'GET' && requestedURL.pathname === `/${compiler.outputFile.fileName}`;
      const isCompilerStatisticsFileRequested
        = request.method === 'GET' && requestedURL.pathname === `/${compiler.statisticsFile.fileName}`;

      if (isCompilerCompileFunctionRequested) {
        const requestedURLParameters = requestedURL.searchParams;

        const pathFromRequestedURLParameters = requestedURLParameters.get('path');

        if (pathFromRequestedURLParameters) {
          await compiler.compile(pathFromRequestedURLParameters);

          response.end();

          return;
        }
      }

      if (isCompilerInputFileRequested) {
        response.end(JSON.stringify(await compiler.inputFile.readFile()));

        return;
      }

      if (isCompilerOutputFileRequested) {
        response.end(JSON.stringify(await compiler.outputFile.readFile()));

        return;
      }

      if (isCompilerStatisticsFileRequested) {
        const requestedURLParameters = requestedURL.searchParams;

        const URLFromRequestedURLParameters = requestedURLParameters.get('url');

        if (request.headers.referer && request.headers['user-agent'] && URLFromRequestedURLParameters) {
          const compilerStatisticsFile = await compiler.statisticsFile.readFile();

          compilerStatisticsFile.requests = [
            ...compilerStatisticsFile.requests,
            {
              headers: {
                referer: request.headers.referer,
                'user-agent': request.headers['user-agent'],
              },
              url: new URL(URLFromRequestedURLParameters).toString(),
            },
          ];

          compiler.statisticsFile.writeFile(compilerStatisticsFile);

          response.end();

          return;
        }

        response.end(JSON.stringify(await compiler.statisticsFile.readFile()));

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

  server.listen(1337);
}
