import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '../types';
import Container from '@redred/pages/private/Container';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  addedContainers: { [ path: string ]: Container } = {};

  messages: t.TypeOf<typeof types.json.Messages> = [];

  addContainer (container: t.TypeOf<typeof types.json.CompilerContainer>): Container {
    if (this.addedContainers[container.path]) {
      return this.addedContainers[container.path];
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

    this.addedContainers[addedContainer.path] = addedContainer;

    this.compile(addedContainer);

    return addedContainer;
  }

  addMessage (message: t.TypeOf<typeof types.json.MessagesMessage>['message']): void {
    this.messages = [
      {
        date: +new Date(),
        message,
      },
      ...this.messages,
    ];
  }

  afterCompilation (container: Container): void {
    if (container.path) {
      this.addMessage(`The path "${container.path}" was compiled.`);

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

          this.addMessage(`The file "${container.path}/public/${page.name}.html" was created.`);
        });

        this.toCompiledJSON();

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
          this.addMessage([ error.message, error.stack, ]);
        }
      });
    }
  }

  toCompiledJSON (): void {
    const compiled: t.TypeOf<typeof types.json.Compiled> = { containers: [], };

    for (const path in this.addedContainers) {
      const container = this.addedContainers[path];

      compiled.containers = [
        ...compiled.containers,
        container.toJSON(),
      ];
    }

    helpers.write('./compiled.json', `${JSON.stringify(compiled)}\n`);

    this.addMessage('The file "./compiled.json" was created.');
  }
}

export default Compiler;
