import Compiler from './Compiler';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';

const compiler = new Compiler();

const l = +new Date();
const r = 159624e7;

if (l < r) {
  const server = http.createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
      response.statusCode = 200;

      const requestedURL = new URL(`file://${request.url}`);

      if (requestedURL.pathname === '/') {
        response.statusCode = 302;

        response.setHeader('Location', '/packages/compiler/public/compiler.html');

        response.end();

        return;
      }

      if (requestedURL.pathname === '/favicon.ico') {
        response.setHeader('Content-Type', 'image/x-icon');

        response.end();

        return;
      }

      const isCompilerCompileFunctionRequested
        = requestedURL.pathname === '/compiler/compile';
      const isCompilerInputFileRequested
        = requestedURL.pathname === `/${compiler.inputFile.fileName}`;
      const isCompilerOutputFileRequested
        = requestedURL.pathname === `/${compiler.outputFile.fileName}`;

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
