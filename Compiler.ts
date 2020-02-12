import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/pages/private/types/json';
import * as t from 'io-ts';
import Container from '@redred/pages/private/Container';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  containers: Map<string, Container> = new Map();

  messages: { date: number; message: string; type: 'error' | 'information' | 'warning' }[] = [];

  addContainer (container: t.TypeOf<typeof json.Compiler>['containers'][0]): Container {
    this.log(`The path "${container.path}" was added to the compiler.`);

    const addedContainer = new Container(null, null, []);

    for (let i = 0; i < container.inputs.length; i += 1) {
      const input = container.inputs[i];

      addedContainer.inputs.set(input, null);
    }

    addedContainer.path = container.path;
    addedContainer.version = container.version;

    this.containers.set(addedContainer.path, addedContainer);

    return addedContainer;
  }

  afterCompilation (container: Container) {
    if (container.path) {
      this.log(`The path "${container.path}" was compiled.`);

      let isCompiled = true;

      container.inputs.forEach((input) => (input === null ? isCompiled = false : null));

      if (isCompiled) {
        try {
          const $ = path.resolve(container.path, './public/assets/server.js');

          delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

          const $$: Container = __non_webpack_require__($).default;

          container.error = null;
          container.id = $$.id;
          container.name = $$.name;
          container.pages = $$.pages;

          container.pages.forEach((page) => {
            try {
              page.context = { ...page.context, container, };

              page.toHTML();

              if (typeof page.html === 'string') {
                helpers.write(`${container.path}/public/${page.name}.html`, page.html);
              }
            } catch (error) {
              container.error = error.stack;
            }

            delete page.context.container;
          });
        } catch (error) {
          container.error = error.stack;
        }

        this.containersToJSON();

        container.inputs.forEach((input, inputPath) => container.inputs.set(inputPath, null));
      }
    }
  }

  compile () {
    this.containers.forEach((container) => {
      container.inputs.forEach((input, inputPath) => {
        delete __non_webpack_require__.cache[__non_webpack_require__.resolve(inputPath)];
        const w = __non_webpack_require__(inputPath);

        webpack(w(container)).watch({}, (...b) => {
          container.inputs.set(inputPath, b[1]);

          const $ = container.inputs.get('./packages/compiler/webpack/client.js');

          if ($) {
            container.assets = Object.keys($.compilation.assets).map((asset) => `./assets/${asset}`);
          }

          this.afterCompilation(container);
        });
      });
    });
  }

  containersToJSON () {
    const compiled: t.TypeOf<typeof json.Compiled> = { containers: [], };

    this.containers.forEach((container) => {
      compiled.containers = [
        ...compiled.containers,
        container.toJSON(),
      ];
    });

    helpers.write('./compiled.json', `${JSON.stringify(compiled, null, 2)}\n`);
  }

  log (message: any, type: 'error' | 'information' | 'warning' = 'information') {
    this.messages = [
      {
        date: +new Date(), message: JSON.stringify(message, null, 2), type,
      },
      ...this.messages,
    ];
  }
}

export default Compiler;
