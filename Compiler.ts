import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/compiler/private/types/json';
import * as t from 'io-ts';
import Container from '@redred/pages/private/Container';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  containers: Map<string, Container> = new Map();

  messages: { date: number; message: string; type: 'error' | 'information' | 'warning' }[] = [];

  addContainer (container: t.TypeOf<typeof json.Compiler>['containers'][0]): Container {
    const addedContainer = new Container([]);

    for (let i = 0; i < container.inputs.length; i += 1) {
      const input = container.inputs[i];

      addedContainer.inputs[input] = '';
    }

    addedContainer.id = container.id;
    addedContainer.isActive = container.isActive;
    addedContainer.name = container.name;
    addedContainer.path = container.path;
    addedContainer.version = container.version;

    this.containers.set(addedContainer.path, addedContainer);

    this.addMessage(`The path "${container.path}" was added to the compiler.`);

    return addedContainer;
  }

  addMessage (message: any, type: 'error' | 'information' | 'warning' = 'information') {
    this.messages = [
      {
        date: +new Date(), message: JSON.stringify(message, null, 2), type,
      },
      ...this.messages,
    ];
  }

  afterCompilation (container: Container) {
    if (container.path) {
      this.addMessage(`The path "${container.path}" was compiled.`);

      let isCompiled = true;

      for (const input in container.inputs) {
        if (container.inputs[input] === '') {
          isCompiled = false;
        }
      }

      if (isCompiled) {
        try {
          const $ = path.resolve(container.path, './public/assets/server.js');

          delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

          const $$: Container = __non_webpack_require__($).default;

          container.pages = $$.pages;

          container.pages.forEach((page) => {
            try {
              page.context = { ...page.context, container, };

              page.toHTML();

              if (typeof page.html === 'string') {
                helpers.write(`${container.path}/public/${page.name}.html`, page.html);

                this.addMessage(`The path "${container.path}/public/${page.name}.html" was created.`);
              }
            } catch (error) {
              console.log('TODO 2408', error);
            }

            delete page.context.container;
          });
        } catch (error) {
          console.log('TODO 2409', error);
        }

        this.containersToJSON();

        for (const input in container.inputs) {
          container.inputs[input] = '';
        }
      }
    }
  }

  compile () {
    this.containers.forEach((container) => {
      for (const input in container.inputs) {
        delete __non_webpack_require__.cache[__non_webpack_require__.resolve(input)];
        const w = __non_webpack_require__(input);

        webpack(w(container)).watch({}, (...b) => {
          container.inputs[input] = b[1].toJson();

          this.afterCompilation(container);
        });
      }
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

    this.addMessage('"./compiled.json"');
  }
}

export default Compiler;
