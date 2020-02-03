import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/pages/private/types/json';
import * as t from 'io-ts';
import Container from '@redred/pages/private/Container';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  S: { date: number; message: string; type: string }[] = [];

  containers: Map<string, Container> = new Map();

  addContainer (container: t.TypeOf<typeof json.Compiler>['containers'][0]): Container {
    this.log(`The path "${container.path}" was added to the compiler.`, 'information');

    const addedContainer = new Container(null, null, []);

    addedContainer.inputs = container.inputs;
    addedContainer.path = container.path;
    addedContainer.version = container.version;

    this.containers.set(addedContainer.path, addedContainer);

    return addedContainer;
  }

  afterCompilation (container: Container) {
    if (container.path) {
      this.log(`The path "${container.path}" was compiled.`, 'information');

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

      try {
        this.containersToJSON(this.containers);
      } catch (error) {
        this.log(error.stack, 'error');
      }
    }
  }

  compile () {
    this.containers.forEach((container) => {
      for (let i = 0; i < container.inputs.length; i += 1) {
        const input = container.inputs[i];

        delete __non_webpack_require__.cache[__non_webpack_require__.resolve(input)];
        const w = __non_webpack_require__(input);

        webpack(w(container)).watch({}, (...b) => {
          const $ = b[1].stats[0];

          const assets = Object.keys($.compilation.assets).map((asset) => `./assets/${asset}`);

          container.assets = [];

          for (let i = 0; i < assets.length; i += 1) {
            container.assets = [
              ...container.assets,
              assets[i],
            ];
          }

          this.afterCompilation(container);
        });
      }
    });
  }

  containersToJSON (containers: Compiler['containers']) {
    const compiled: t.TypeOf<typeof json.Compiled> = { containers: [], };

    containers.forEach((container) => {
      if (container.path && container.version) {
        compiled.containers = [
          ...compiled.containers,
          container.toJSON(),
        ];
      }
    });

    helpers.write('./compiled.json', `${JSON.stringify(compiled, null, 2)}\n`);
  }

  log (message: any, type: 'error' | 'information' | 'warning') {
    this.S = [
      {
        date: +new Date(), message: JSON.stringify(message, null, 2), type,
      },
      ...this.S,
    ];
  }
}

export default Compiler;
