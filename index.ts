import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import addMessage, { messages } from './compiler/addMessage';
import compile from './compiler/compile';
import http from 'http';
import path from 'path';
import readInputFile, { INPUT_FILE_NAME } from './compiler/readInputFile';
import readOutputFile, { OUTPUT_FILE_NAME } from './compiler/readOutputFile';

compile('./packages/compiler', 'development'); // ?!

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    response.statusCode = 200;

    const requestedURL = new URL(`file://${request.url}`);

    const areCompilerMessagesRequested =
      requestedURL.pathname === '/compiler/messages';
    const isCompilerInputFileRequested =
      requestedURL.pathname === `/${INPUT_FILE_NAME}`;
    const isCompilerOutputFileRequested =
      requestedURL.pathname === `/${OUTPUT_FILE_NAME}`;

    if (areCompilerMessagesRequested) {
      const compilerMessages = await helpers.validateInput(
        types.CompilerMessages,
        messages
      );

      response.end(JSON.stringify(compilerMessages));

      return;
    }

    if (isCompilerInputFileRequested) {
      response.end(JSON.stringify(await readInputFile()));

      return;
    }

    if (isCompilerOutputFileRequested) {
      response.end(JSON.stringify(await readOutputFile()));

      return;
    }

    if (requestedURL.pathname === '/compiler/compile') {
      const pathFromRequestedURLParameters = requestedURL.searchParams.get(
        'path'
      );
      const versionFromRequestedURLParameters = requestedURL.searchParams.get(
        'version'
      );

      if (pathFromRequestedURLParameters && versionFromRequestedURLParameters) {
        await compile(
          pathFromRequestedURLParameters,
          versionFromRequestedURLParameters
        );

        response.end();

        return;
      }
    }

    const mime = helpers.mime(path.extname(requestedURL.pathname));

    response.setHeader(
      'Content-Type',
      mime.charset ? `${mime.typeName}; charset=${mime.charset}` : mime.typeName
    );

    response.end(
      await helpers.readFile(`.${requestedURL.pathname}`, 'base64'),
      'base64'
    );
  } catch (error) {
    response.statusCode = 500;

    response.end(JSON.stringify({ errors: [[error.message, error.stack]] }));

    addMessage([error.message, error.stack]);
  }
});

server.listen(1337);
