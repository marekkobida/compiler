import http from 'http';
import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import Compiler from './Compiler';

const compiler = new Compiler();

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  response.statusCode = 200;

  const requestedURL = new URL(`file://${request.url}`);

  const areCompilerMessagesRequested =
    requestedURL.pathname === '/compiler/messages';
  const isCompilerInputFileRequested =
    requestedURL.pathname === `/${compiler.inputFileName}`;
  const isCompilerOutputFileRequested =
    requestedURL.pathname === `/${compiler.outputFileName}`;

  try {
    if (isCompilerInputFileRequested) {
      response.end(JSON.stringify(await compiler.inputFile()));

      return;
    }

    if (isCompilerOutputFileRequested) {
      response.end(JSON.stringify(await compiler.outputFile()));

      return;
    }

    if (areCompilerMessagesRequested) {
      const compilerMessages = await helpers.validateInput(
        types.CompilerMessages,
        compiler.messages
      );

      response.end(JSON.stringify(compilerMessages));

      return;
    }

    if (requestedURL.pathname === '/compiler/compile') {
      const pathFromRequestedURL = requestedURL.searchParams.get('path');

      if (pathFromRequestedURL) {
        const versionFromRequestedURL = requestedURL.searchParams.get(
          'version'
        );

        if (versionFromRequestedURL) {
          await compiler.compile(pathFromRequestedURL, versionFromRequestedURL);

          response.end();

          return;
        }

        throw new Error('The version does not exist in the requested URL.');
      }

      throw new Error('The path does not exist in the requested URL.');
    }

    if (requestedURL.pathname === '/favicon.ico') {
      response.setHeader('Content-Type', 'image/x-icon');

      response.end();

      return;
    }

    const mime = helpers.mime(path.extname(requestedURL.pathname));

    response.setHeader(
      'Content-Type',
      mime.charset ? `${mime.typeName}; charset=${mime.charset}` : mime.typeName
    );

    response.end(
      await helpers.read(`.${requestedURL.pathname}`, 'base64'),
      'base64'
    );
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    response.end();

    compiler.addMessage([error.message, error.stack]);
  }
});

server.listen(1337);
