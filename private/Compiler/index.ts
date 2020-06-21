import Compiler from './Compiler';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import os from 'os';
import p from './package.json';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';
import test from './test';

const l: number = +new Date();
const r: number = 159624e7;

if (l < r) {
  test('PUT');

  const compiler = new Compiler();

  const server = http.createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
      response.statusCode = 200;

      const requestedURL = new URL(request.url, `http://${request.headers.host}`);
      const requestedURLParameters = requestedURL.searchParams;

      if (requestedURL.pathname === '/about.json') {
        response.end(JSON.stringify({ name: os.hostname(), version: p.version, }));

        return;
      }

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

      const $ = mime(path.extname(requestedURL.pathname));

      response.setHeader('Content-Type', $.charset ? `${$.typeName}; charset=${$.charset}` : $.typeName);

      response.end(await readFile(`.${requestedURL.pathname}`, 'base64'), 'base64');
    } catch (error) {
      response.statusCode = 500;

      response.end(JSON.stringify({ errors: [ error.message, ], }));
    }
  });

  server.listen(1337);

  process.stdout.write(`\x1b[31m    x  x\n x        x\nx          x\nx          x\n x        x\n    x  x\x1b[0m\n\n${p.name}\n${p.version}\n`);
}
