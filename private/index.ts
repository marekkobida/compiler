import * as helpers from '@redredsk/helpers/server';
import Compiler from './Compiler';
import http from 'http';
import path from 'path';

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
      = requestedURL.pathname === '/compiler/compile';
    const isInputFileRequested
      = requestedURL.pathname === `/${compiler.inputFile.fileName}`;
    const isOutputFileRequested
      = requestedURL.pathname === `/${compiler.outputFile.fileName}`;

    if (isCompilerCompileFunctionRequested) {
      const requestedURLParameters = requestedURL.searchParams;

      const pathFromRequestedURLParameters = requestedURLParameters.get('path');

      const versionFromRequestedURLParameters = requestedURLParameters.get('version');

      if (pathFromRequestedURLParameters && versionFromRequestedURLParameters) {
        await compiler.compile(pathFromRequestedURLParameters, versionFromRequestedURLParameters);

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

    const mime = helpers.mime(path.extname(requestedURL.pathname));

    response.setHeader('Content-Type', mime.charset ? `${mime.typeName}; charset=${mime.charset}` : mime.typeName);

    response.end(await helpers.readFile(`.${requestedURL.pathname}`, 'base64'), 'base64');
  } catch (error) {
    response.statusCode = 500;

    response.end(JSON.stringify({ errors: [ error.message, ], }));
  }
});

server.listen(1337);
