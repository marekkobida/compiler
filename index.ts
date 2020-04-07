import http from 'http';
import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import Compiler from './Compiler';
import mime from './mime';

const compiler = new Compiler();

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');

  const requestedURL = new URL(`file://${request.url}`);

  try {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    response.statusCode = 200;

    if (requestedURL.pathname === '/add-container') {
      if (requestedURL.searchParams.has('path')) {
        const pathFromURL = requestedURL.searchParams.get('path');

        const compilerInputFile = await helpers.validateInputFromPath(types.CompilerInputFile, compiler.inputFile);

        const compilerInputFileContainers = compilerInputFile.containers;

        for (let i = 0; i < compilerInputFileContainers.length; i += 1) {
          const compilerInputFileContainer = compilerInputFileContainers[i];

          if (pathFromURL === compilerInputFileContainer.path) {
            if (requestedURL.searchParams.has('version')) {
              const versionFromRequestedURL = requestedURL.searchParams.get('version');

              if (versionFromRequestedURL === 'development' || versionFromRequestedURL === 'production') {
                compilerInputFileContainer.version = versionFromRequestedURL;
              }
            }

            const addedContainerInCompiler = compiler.addContainer(compilerInputFileContainer);

            response.end(`The path "${addedContainerInCompiler.path}" was added to the compiler.`);

            return;
          }
        }

        throw new Error(`The path "${pathFromURL}" does not exist.`);
      }

      throw new Error('The path does not exist.');
    }

    if (requestedURL.pathname === `/${compiler.outputFile}`) {
      const compilerOutputFile = await helpers.validateInputFromPath(types.CompilerOutputFile, compiler.outputFile);

      response.end(JSON.stringify(compilerOutputFile));

      return;
    }

    if (requestedURL.pathname === `/${compiler.inputFile}`) {
      const compilerInputFile = await helpers.validateInputFromPath(types.CompilerInputFile, compiler.inputFile);

      response.end(JSON.stringify(compilerInputFile));

      return;
    }

    if (requestedURL.pathname === '/added-messages') {
      const compilerMessages = await helpers.validateInput(types.CompilerMessages, compiler.addedMessages);

      response.end(JSON.stringify(compilerMessages));

      return;
    }

    if (requestedURL.pathname === '/favicon.ico') {
      response.setHeader('Content-Type', 'image/x-icon');

      response.end();

      return;
    }

    const $ = mime(path.extname(requestedURL.pathname));

    response.setHeader('Content-Type', $.charset ? `${$.typeName}; charset=${$.charset}` : $.typeName);

    response.end(await helpers.read(`.${requestedURL.pathname}`, 'base64'), 'base64');
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    response.statusCode = 500;

    response.end(error.stack);

    compiler.addMessage([ error.message, `.${requestedURL.pathname}\n\n${error.stack}`, ]);
  }
});

server.listen(1337);
