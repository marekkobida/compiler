import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as json from '@redred/compiler/private/types/json';
import * as t from 'io-ts';
import Container from '@redred/pages/private/Container';
import ServerPaths from '../ServerPaths';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  containers: { [ path: string ]: Container } = {};

  messages: NonNullable<t.TypeOf<typeof ServerPaths>['/messages.json']> = [];

  addContainer (container: t.TypeOf<typeof json.CompilerContainer>): Container {
    if (this.containers[container.path]) {
      // throw new Error(`The path "${container.path}" exists in the compiler.`);

      const addedContainer = this.containers[container.path];

      if (addedContainer.w.closed) {
        addedContainer.w.resume();
        this.addMessage(`The path "${addedContainer.path}" was added to the compiler.`, {});
      } else {
        addedContainer.w.close(() => {
          this.addMessage(`The path "${addedContainer.path}" was deleted from the compiler.`, {});
        });
      }

      return this.containers[container.path];
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

    this.containers[addedContainer.path] = addedContainer;

    this.addMessage(`The path "${addedContainer.path}" was added to the compiler.`, {});

    this.compile(addedContainer);

    return addedContainer;
  }

  addMessage (message: Compiler['messages'][0]['message'], style: Compiler['messages'][0]['style']): void {
    this.messages = [
      {
        date: +new Date(),
        message,
        style,
      },
      ...this.messages,
    ];
  }

  afterCompilation (container: Container): void {
    if (container.path) {
      this.addMessage(`The path "${container.path}" was compiled.`, {});

      let isCompiled = true;

      for (const input in container.inputs) {
        if (container.inputs[input] === '') {
          isCompiled = false;
        }
      }

      if (isCompiled) {
        const $ = path.resolve(container.path, './public/server.js');

        delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

        const $$: Container = __non_webpack_require__($).default;

        container.pages = $$.pages;

        container.pages.forEach((page) => {
          page.context = { ...page.context, container: container, };

          page.toHTML();

          if (typeof page.html === 'string') {
            helpers.write(`${container.path}/public/${page.name}.html`, page.html);
          }

          delete page.context.container;

          this.addMessage(`The file "${container.path}/public/${page.name}.html" was created.`, {});
        });

        this.containersToJSON();

        for (const input in container.inputs) {
          container.inputs[input] = '';
        }
      }
    }
  }

  compile (container: Container): void {
    for (const input in container.inputs) {
      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(input)];

      const $ = __non_webpack_require__(input);

      container.w = webpack($(container)).watch({}, (left: Error, right: { toJson: () => unknown }) => {
        container.inputs[input] = right.toJson();

        try {
          this.afterCompilation(container);
        } catch (error) {
          this.addMessage([ error.message, error.stack, ], { backgroundColor: '#f00', color: '#fff', });
        }
      });
    }
  }

  containersToJSON (): void {
    const compiled: t.TypeOf<typeof json.Compiled> = { containers: [], };

    for (const path in this.containers) {
      const container = this.containers[path];

      compiled.containers = [
        ...compiled.containers,
        container.toJSON(),
      ];
    }

    helpers.write('./compiled.json', `${JSON.stringify(compiled)}\n`);

    this.addMessage('The file "./compiled.json" was created.', {});
  }
}

export default Compiler;
