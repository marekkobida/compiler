import http from 'http';
import path from 'path';

import mime from '@redredsk/helpers/private/mime';
import readFile from '@redredsk/helpers/private/readFile';

import { version, } from '../package.json';

import Compiler from './Compiler';

const l = +new Date();
const r = 15989184e5;

if (l < r) {
  const compiler = new Compiler();

  const server = http.createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');

    try {
      response.statusCode = 200;

      const requestedURL = new URL(request.url as string, `http://${request.headers.host}`);
      const requestedURLParameters = requestedURL.searchParams;

      const $ = mime(path.extname(requestedURL.pathname));

      response.setHeader('Content-Type', $.charset ? `${$.typeName}; charset=${$.charset}` : $.typeName);

      // About

      if (requestedURL.pathname === '/about.json') {
        response.end(JSON.stringify({ version, }));

        return;
      }

      // Compiler

      if (requestedURL.pathname === '/compiler/compile') {
        const pathFromRequestedURLParameters = requestedURLParameters.get('path');

        if (pathFromRequestedURLParameters) {
          compiler.compile(pathFromRequestedURLParameters);

          response.end('');

          return;
        }
      }

      if (requestedURL.pathname === `/compiler/${compiler.inputFile.fileName}`) {
        response.end(JSON.stringify(compiler.inputFile.$));

        return;
      }

      if (requestedURL.pathname === `/compiler/${compiler.outputFile.fileName}`) {
        response.end(JSON.stringify(compiler.outputFile.$));

        return;
      }

      response.end(await readFile(`.${requestedURL.pathname}`, 'base64'), 'base64');
    } catch (error) {
      response.statusCode = 500;

      response.end(JSON.stringify({ errors: [ error.message, ], }));
    }
  });

  server.listen(1337);
}
