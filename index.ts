import http from 'http';
import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import Compiler from './Compiler';
import mime from './mime';

const compiler = new Compiler();

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');

  try {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    response.statusCode = 200;

    const requestedURL = new URL(`file://${request.url}`);

    /**
     * /compile
     * /compile?path=./packages/compiler
     * /compile?path=./packages/compiler&version=development
     */
    if (requestedURL.pathname === '/compile') {
      if (requestedURL.searchParams.has('path')) {
        const pathFromURL = requestedURL.searchParams.get('path');

        const compilerJSON = await helpers.validateInputFromPath(types.json.Compiler, './compiler.json');

        const containersFromCompilerJSON = compilerJSON.containers;

        for (let i = 0; i < containersFromCompilerJSON.length; i += 1) {
          const containerFromCompilerJSON = containersFromCompilerJSON[i];

          if (pathFromURL === containerFromCompilerJSON.path) {
            if (requestedURL.searchParams.has('version')) {
              const versionFromURL = requestedURL.searchParams.get('version');

              if (versionFromURL === 'development' || versionFromURL === 'production') {
                containerFromCompilerJSON.version = versionFromURL;
              }
            }

            const addedContainerToCompiler = compiler.addContainer(containerFromCompilerJSON);

            response.end(`The path "${addedContainerToCompiler.path}" was added to the compiler.`);

            compiler.addMessage(`The path "${addedContainerToCompiler.path}" was added to the compiler.`);

            return;
          }
        }

        throw new Error(`The path "${pathFromURL}" does not exist in the "./compiler.json".}`);
      }

      throw new Error('The path does not exist.');
    }

    /**
     * /compiled.json
     */
    if (requestedURL.pathname === '/compiled.json') {
      const compiledJSON = await helpers.validateInputFromPath(types.json.Compiled, './compiled.json');

      response.end(JSON.stringify(compiledJSON));

      return;
    }

    /**
     * /compiler.json
     */
    if (requestedURL.pathname === '/compiler.json') {
      const compilerJSON = await helpers.validateInputFromPath(types.json.Compiler, './compiler.json');

      response.end(JSON.stringify(compilerJSON));

      return;
    }

    /**
     * /messages.json
     */
    if (requestedURL.pathname === '/messages.json') {
      const messagesJSON = await helpers.validateInputFromPath(types.json.Messages, './messages.json');

      response.end(JSON.stringify(messagesJSON));

      return;
    }

    const $ = mime(path.extname(requestedURL.pathname));

    if ($.charset) {
      $.typeName += `; charset=${$.charset}`;
    }

    response.setHeader('Content-Type', $.typeName);

    response.end(await helpers.read(`.${requestedURL.pathname}`, 'base64'), 'base64');
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    response.statusCode = 500;

    response.end(error.stack);

    compiler.addMessage([ error.message, error.stack, ]);
  }
});

server.listen(1337);
