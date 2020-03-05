import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/compiler/private/types/json';
import * as t from 'io-ts';
import Container from '@redred/pages/private/Container';
import ServerPaths from '../ServerPaths';
import webpack from 'webpack';

class Compiler {
  addedContainers: Map<string, Container> = new Map();

  messages: NonNullable<t.TypeOf<typeof ServerPaths>['/messages.json']> = [];

  addContainer (container: t.TypeOf<typeof json.Compiler>['containers'][0]): Container {
    if (this.addedContainers.has(container.path)) {
      throw new Error(`The path "${container.path}" exists in the compiler.`);
    }

    const addedContainer = new Container([]);

    addedContainer.id = container.id;

    for (let i = 0; i < container.inputs.length; i += 1) {
      const input = container.inputs[i];

      addedContainer.inputs[input] = '';
    }

    addedContainer.name = container.name;
    addedContainer.path = container.path;
    addedContainer.version = container.version;

    this.addedContainers.set(addedContainer.path, addedContainer);

    this.addMessage(`The path "${addedContainer.path}" was added to the compiler.`, {});

    this.compile(addedContainer);

    return addedContainer;
  }

  addMessage (message: unknown, style: Compiler['messages'][0]['style']): void {
    this.messages = [
      {
        date: +new Date(),
        message: JSON.stringify(message, null, 2),
        style,
      },
      ...this.messages,
    ];
  }

  afterCompilation (addedContainer: Container): void {
    if (addedContainer.path) {
      this.addMessage(`The path "${addedContainer.path}" was compiled.`, {});

      let isCompiled = true;

      for (const input in addedContainer.inputs) {
        if (addedContainer.inputs[input] === '') {
          isCompiled = false;
        }
      }

      if (isCompiled) {
        const $ = path.resolve(addedContainer.path, './public/server.js');

        delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

        const $$: Container = __non_webpack_require__($).default;

        addedContainer.pages = $$.pages;

        addedContainer.pages.forEach((page) => {
          page.context = { ...page.context, container: addedContainer, };

          page.toHTML();

          if (typeof page.html === 'string') {
            helpers.write(`${addedContainer.path}/public/${page.name}.html`, page.html);
          }

          delete page.context.container;

          this.addMessage(`The file "${addedContainer.path}/public/${page.name}.html" was created.`, {});
        });

        this.containersToJSON();

        for (const input in addedContainer.inputs) {
          addedContainer.inputs[input] = '';
        }
      }
    }
  }

  compile (addedContainer: Container): void {
    for (const input in addedContainer.inputs) {
      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(input)];

      const $ = __non_webpack_require__(input);

      webpack($(addedContainer)).watch({}, (left: Error, right: { toJson: () => unknown }) => {
        addedContainer.inputs[input] = right.toJson();

        try {
          this.afterCompilation(addedContainer);
        } catch (error) {
          this.addMessage('#f00', error.stack);
        }
      });
    }
  }

  containersToJSON (): void {
    const compiled: t.TypeOf<typeof json.Compiled> = { containers: [], };

    this.addedContainers.forEach((addedContainer) => {
      compiled.containers = [
        ...compiled.containers,
        addedContainer.toJSON(),
      ];
    });

    helpers.write('./compiled.json', `${JSON.stringify(compiled, null, 2)}\n`);

    this.addMessage('The file "./compiled.json" was created.', {});
  }
}

export default Compiler;
