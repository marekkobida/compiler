import path from 'path';

import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '../types';
import Container from '@redred/pages/private/Container';

const webpack = __non_webpack_require__('webpack');

type CompilerInputFileContainer = t.TypeOf<typeof types.CompilerInputFileContainer>;

type CompilerMessage = t.TypeOf<typeof types.CompilerMessage>;

type CompilerMessages = t.TypeOf<typeof types.CompilerMessages>;

type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

class Compiler {
  addedContainers: { [ path: string ]: Container } = {};

  addedMessages: CompilerMessages = [];

  inputFile = 'compiler.json';

  outputFile = 'compiled.json';

  constructor () {
    this.toJSON();
  }

  addContainer (container: CompilerInputFileContainer): Container {
    let addedContainer = this.addedContainers[container.path];

    if (addedContainer) {
      this.addMessage(`The path "${addedContainer.path}" exists in the compiler.`);

      return addedContainer;
    }

    addedContainer = new Container([]);

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

    this.addMessage(`The path "${addedContainer.path}" was added to the compiler.`);

    return addedContainer;
  }

  addMessage (message: CompilerMessage['message']): void {
    this.addedMessages = [
      {
        date: +new Date(),
        message,
      },
      ...this.addedMessages,
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
        const $ = path.resolve(container.path, 'public/server.js');

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

        this.toJSON();

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

      webpack($(container)).watch({}, (left: Error, right: { toJson: () => unknown }) => {
        container.inputs[input] = right.toJson();

        try {
          this.afterCompilation(container);
        } catch (error) {
          this.addMessage([ error.message, error.stack, ]);
        }
      });
    }
  }

  toJSON (): void {
    const compiled: CompilerOutputFile = { containers: [], };

    for (const addedContainerPath in this.addedContainers) {
      const addedContainer = this.addedContainers[addedContainerPath];

      compiled.containers = [
        ...compiled.containers,
        addedContainer.toJSON(),
      ];
    }

    helpers.write(this.outputFile, `${JSON.stringify(compiled)}\n`);

    this.addMessage(`The file "${this.outputFile}" was created.`);
  }
}

export default Compiler;
