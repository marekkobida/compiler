import * as compiler from './compiler';
import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import http from 'http';
import path from 'path';

compiler.toJSON();

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    response.statusCode = 200;

    const requestedURL = new URL(`file://${request.url}`);

    const areCompilerMessagesRequested =
      requestedURL.pathname === '/compiler/messages';
    const isCompilerInputFileRequested =
      requestedURL.pathname === `/${compiler.inputFileName}`;
    const isCompilerOutputFileRequested =
      requestedURL.pathname === `/${compiler.outputFileName}`;

    if (areCompilerMessagesRequested) {
      const compilerMessages = await helpers.validateInput(
        types.CompilerMessages,
        compiler.messages
      );

      response.end(JSON.stringify(compilerMessages));

      return;
    }

    if (isCompilerInputFileRequested) {
      response.end(JSON.stringify(await compiler.readInputFile()));

      return;
    }

    if (isCompilerOutputFileRequested) {
      response.end(JSON.stringify(await compiler.readOutputFile()));

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
        await compiler.compile(
          pathFromRequestedURLParameters,
          versionFromRequestedURLParameters
        );

        response.end();

        return;
      }

      throw new Error(
        'The path or the version does not exist in the requested URL parameters.'
      );
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
  }
});

server.listen(1337);
