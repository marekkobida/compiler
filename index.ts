import http from 'http';
import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/compiler/private/types/json';

import Compiler from './Compiler';
import mime from './mime';

const compiler = new Compiler();

compiler.containersToJSON();

const server = http.createServer(async (request, response) => {
  const url = new URL(`file://${request.url}`);

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  response.statusCode = 200;

  try {
    if (url.pathname === '/compile') {
      if (url.searchParams.has('path')) {
        const compilerJSON = await helpers.validateInputFromPath(json.Compiler, './compiler.json');

        for (let i = 0; i < compilerJSON.containers.length; i += 1) {
          const container = compilerJSON.containers[i];

          if (container.path === url.searchParams.get('path')) {
            const version = url.searchParams.get('version');

            if (version === 'development' || version === 'production') {
              container.version = version;
            }

            compiler.addContainer(container);

            response.end(JSON.stringify(`The path "${container.path}" was added to the compiler.`));

            return;
          }
        }
      }
    }

    if (url.pathname === '/compiled.json') {
      const compiledJSON = await helpers.validateInputFromPath(json.Compiled, './compiled.json');

      response.end(JSON.stringify(compiledJSON));

      return;
    }

    if (url.pathname === '/compiler.json') {
      const compilerJSON = await helpers.validateInputFromPath(json.Compiler, './compiler.json');

      response.end(JSON.stringify(compilerJSON));

      return;
    }

    if (url.pathname === '/favicon.ico') {
      response.setHeader('Content-Type', 'image/x-icon');
      response.end();

      return;
    }

    if (url.pathname === '/messages.json') {
      response.end(JSON.stringify(compiler.messages));

      return;
    }

    response.setHeader('Content-Type', mime(path.extname(url.pathname)));

    const data = await helpers.read(`.${url.pathname}`, 'base64');

    response.end(data, 'base64');
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    response.statusCode = 500;

    response.end(JSON.stringify(error.stack));

    compiler.addMessage([ error.message, error.stack, ], { backgroundColor: '#f00', color: '#fff', });
  }
});

server.listen(1337);
