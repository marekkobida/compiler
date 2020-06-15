import Compiler from './index';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';

const compiler = new Compiler();

const compilerServer = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    response.statusCode = 200;

    const requestedURL = new URL(request.url, `http://${request.headers.host}`);
    const requestedURLParameters = requestedURL.searchParams;

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

export default compilerServer;
