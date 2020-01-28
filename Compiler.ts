import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/pages/private/types/json';
import * as t from 'io-ts';
import Container from '@redred/pages/private/Container';

import test from './test';

class Compiler {
  containers: Map<string, Container> = new Map();

  addContainer (container: t.TypeOf<typeof json.Compiler>['containers'][0]): Container {
    test(`The path "${container.path}" was added to the compiler.`, 'information');

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
      test(`The path "${container.path}" was compiled.`, 'information');

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

        this.containersToJSON(this.containers);

        container.inputs.forEach((input, inputPath) => container.inputs.set(inputPath, null));
      }
    }
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

    helpers.write('./compiled.json', JSON.stringify(compiled, null, 2));
  }
}

export default Compiler;
