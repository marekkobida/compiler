import http from 'http';
import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import Compiler from './Compiler';
import mime from './mime';

const compiler = new Compiler();

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  response.statusCode = 200;

  const requestedURL = new URL(`file://${request.url}`);

  try {
    if (requestedURL.pathname === `/${compiler.outputFileName}`) {
      response.end(JSON.stringify(await compiler.outputFile()));

      return;
    }

    if (requestedURL.pathname === `/${compiler.inputFileName}`) {
      response.end(JSON.stringify(await compiler.inputFile()));

      return;
    }

    if (requestedURL.pathname === '/compiler/added-messages') {
      const compilerMessages = await helpers.validateInput(
        types.CompilerMessages,
        compiler.addedMessages
      );

      response.end(JSON.stringify(compilerMessages));

      return;
    }

    if (requestedURL.pathname === '/compiler/compile') {
      const pathFromURL = requestedURL.searchParams.get('path');

      if (pathFromURL) {
        const versionFromURL = requestedURL.searchParams.get('version');

        if (versionFromURL) {
          await compiler.compile(pathFromURL, versionFromURL);

          response.end();

          return;
        }

        throw new Error('The version does not exist.');
      }

      throw new Error('The path does not exist.');
    }

    if (requestedURL.pathname === '/favicon.ico') {
      response.setHeader('Content-Type', 'image/x-icon');

      response.end();

      return;
    }

    const $ = mime(path.extname(requestedURL.pathname));

    response.setHeader(
      'Content-Type',
      $.charset ? `${$.typeName}; charset=${$.charset}` : $.typeName
    );

    response.end(
      await helpers.read(`.${requestedURL.pathname}`, 'base64'),
      'base64'
    );
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    response.end();

    compiler.addMessage({message: [error.message, error.stack]});
  }
});

server.listen(1337);
