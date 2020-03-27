import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import Compiler from './Compiler';
import http from 'http';
import mime from './mime';
import path from 'path';

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
        const compilerJSON = await helpers.validateInputFromPath(types.json.Compiler, './compiler.json');

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
      const compiledJSON = await helpers.validateInputFromPath(types.json.Compiled, './compiled.json');

      response.end(JSON.stringify(compiledJSON));

      return;
    }

    if (url.pathname === '/compiler.json') {
      const compilerJSON = await helpers.validateInputFromPath(types.json.Compiler, './compiler.json');

      response.end(JSON.stringify(compilerJSON));

      return;
    }

    if (url.pathname === '/messages.json') {
      response.end(JSON.stringify(compiler.messages));

      return;
    }

    const m = mime(path.extname(url.pathname));

    if (m.charset) {
      m.typeName += `; charset=${m.charset}`;
    }

    response.setHeader('Content-Type', m.typeName);

    const data = await helpers.read(`.${url.pathname}`, 'base64');

    response.end(data, 'base64');
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    response.statusCode = 500;

    response.end(error.stack);

    compiler.addMessage([ error.message, error.stack, ], { backgroundColor: '#f00', color: '#fff', });
  }
});

server.listen(1337);
