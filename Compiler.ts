import p from 'path';

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
  addedContainers: { [path: string]: Container } = {};

  addedMessages: CompilerMessages = [];

  inputFileName = 'compiler.json';

  outputFileName = 'compiled.json';

  constructor() {
    this.toJSON();
  }

  async compile(
    pathFromURL: CompilerInputFileContainer['path'],
    versionFromURL: string
  ) {
    if (this.addedContainers[pathFromURL]) {
      this.addMessage({
        message: `The path "${pathFromURL}" exists in the compiler.`,
      });

      return;
    }

    const inputFile = await this.inputFile();

    const inputFileContainers = inputFile.containers;

    for (let i = 0; i < inputFileContainers.length; i += 1) {
      const inputFileContainer = inputFileContainers[i];

      if (inputFileContainer.path === pathFromURL) {
        for (let i = 0; i < inputFileContainer.inputs.length; i += 1) {
          const input = inputFileContainer.inputs[i];

          delete __non_webpack_require__.cache[
            __non_webpack_require__.resolve(input)
            ];

          const $ = __non_webpack_require__(input);

          webpack($(inputFileContainer, versionFromURL)).watch(
            {},
            (left: Error, right: { toJson: () => unknown }) => {
              try {
                this.afterCompilation(
                  inputFileContainer,
                  input,
                  right.toJson(),
                  versionFromURL
                );
              } catch (error) {
                this.addMessage({message: [error.message, error.stack]});
              }
            }
          );
        }

        this.addMessage({
          message: `The path "${pathFromURL}" was added to the compiler in the ${versionFromURL} version.`,
        });

        return;
      }
    }

    throw new Error(`The path "${pathFromURL}" does not exist.`);
  }

  addMessage(message: CompilerMessage): void {
    this.addedMessages = [
      {date: message.date ? message.date : +new Date(), ...message},
      ...this.addedMessages,
    ];
  }

  afterCompilation(
    container: CompilerInputFileContainer,
    input: string,
    json: unknown,
    versionFromURL: string
  ): void {
    this.addMessage({
      message: `The path "${container.path}" was compiled in the ${versionFromURL} version.`,
    });

    const $ = p.resolve(container.path, 'public/server.js');

    delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

    const compiledContainer: Container = __non_webpack_require__($).default;

    const addedContainer = this.addedContainers[container.path];

    if (addedContainer) {
      addedContainer.inputs[input] = json;

      if (
        Object.keys(addedContainer.inputs).length === container.inputs.length
      ) {
        console.log('builol som všetky inputy');

        addedContainer.pages.forEach((page) => {
          page.context = {...page.context, container: addedContainer};

          page.toHTML();

          if (typeof page.html === 'string') {
            helpers.write(
              `${addedContainer.path}/public/${page.name}.html`,
              page.html
            );
          }

          delete page.context.container;

          this.addMessage({
            message: `The file "${addedContainer.path}/public/${page.name}.html" was created.`,
          });
        });

        this.toJSON();

        console.log(this.addedContainers);

        addedContainer.inputs = {};

        console.log(this.addedContainers);
      }

      return;
    }

    compiledContainer.inputs[input] = json;
    compiledContainer.path = container.path;
    compiledContainer.version = versionFromURL;

    this.addedContainers[container.path] = compiledContainer;
  }

  inputFile() {
    return helpers.validateInputFromPath(
      types.CompilerInputFile,
      this.inputFileName
    );
  }

  outputFile() {
    return helpers.validateInputFromPath(
      types.CompilerOutputFile,
      this.outputFileName
    );
  }

  toJSON(): void {
    const compiled: CompilerOutputFile = {containers: []};

    for (const addedContainerPath in this.addedContainers) {
      const addedContainer = this.addedContainers[addedContainerPath];

      compiled.containers = [...compiled.containers, addedContainer.toJSON()];
    }

    helpers.write(this.outputFileName, `${JSON.stringify(compiled)}\n`);

    this.addMessage({
      message: `The file "${this.outputFileName}" was created.`,
    });
  }
}

export default Compiler;
