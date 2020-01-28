import http from 'http';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/pages/private/types/json';

import Compiler from './Compiler';
import mime from './mime';
import test, { S, } from './test';

const compiler = new Compiler();

const server = http.createServer(async (request, response) => {
  const url = new URL(`file://${request.url}`);

  if (url.pathname === '/favicon.ico') {
    return;
  }

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  response.statusCode = 200;

  try {
    const compiledJSON = await helpers.validateInputFromPath(json.Compiled, './compiled.json');
    const compilerJSON = await helpers.validateInputFromPath(json.Compiler, './compiler.json');

    if (url.pathname === '/test') {
      response.end(JSON.stringify(S));

      return;
    }

    if (url.pathname === '/compile') {
      if (url.searchParams.has('path')) {
        for (let i = 0; i < compilerJSON.containers.length; i += 1) {
          const container = compilerJSON.containers[i];

          if (container.path === url.searchParams.get('path')) {
            if (url.searchParams.has('version')) {
              const version = url.searchParams.get('version');

              if (version === 'development' || version === 'production') {
                container.version = version;
              }
            }

            if (compiler.containers.has(container.path)) {
              response.end(JSON.stringify(`The path "${container.path}" exists in the compiler.`));

              test(`The path "${container.path}" exists in the compiler.`, 'warning');

              return;
            }

            compiler.addContainer(container);

            compiler.compile();

            response.end(JSON.stringify(`The path "${container.path}" was added to the compiler.`));

            return;
          }
        }
      }
    }

    if (url.pathname === '/compiled.json') {
      response.end(JSON.stringify(compiledJSON));

      test(compiledJSON, 'information');

      return;
    }

    if (url.pathname === '/compiler.json') {
      response.end(JSON.stringify(compilerJSON));

      test(compilerJSON, 'information');

      return;
    }

    for (let i = 0; i < compiledJSON.containers.length; i += 1) {
      const container = compiledJSON.containers[i];

      const _ = container.path.replace(/^\.\//, '');
      const __ = new RegExp(`\\/${_}`).exec(url.pathname);
      const ___ = new RegExp(`\\/${_}\\/public\\/(.+)`).exec(url.pathname);

      if (__ && ___) {
        if (container.error) {
          throw new Error(container.error);
        }
      }

      if (___) {
        const data = await helpers.read(`${container.path}/public/${___[1]}`);

        response.setHeader('Content-Type', mime(url.pathname));

        response.end(data);

        return;
      }
    }

    throw new Error(`The request "${url.toString()}" is not valid.`);
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');

    response.end(JSON.stringify(error.stack));

    test(error.stack, 'error');
  }
});

server.listen(1337);
