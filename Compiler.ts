import p from 'path';

import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '../types';
import Container from '@redred/pages/private/Container';

const webpack = __non_webpack_require__('webpack');

type CompilerInputFileContainer = t.TypeOf<
  typeof types.CompilerInputFileContainer
>;
type CompilerMessage = t.TypeOf<typeof types.CompilerMessage>;
type CompilerMessages = t.TypeOf<typeof types.CompilerMessages>;
type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

class Compiler {
  containers: { [path: string]: Container } = {};

  inputFileName = 'compiler.json';

  messages: CompilerMessages = [];

  outputFileName = 'compiled.json';

  constructor() {
    this.toJSON();
  }

  async compile(
    pathFromURL: CompilerInputFileContainer['path'],
    versionFromURL: string
  ) {
    if (this.containers[pathFromURL]) {
      this.addMessage(`The path "${pathFromURL}" exists in the compiler.`);

      return;
    }

    const inputFile = await this.readInputFile();

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
                this.addMessage([error.message, error.stack]);
              }
            }
          );
        }

        this.addMessage(
          `The path "${pathFromURL}" was added to the compiler in the ${versionFromURL} version.`
        );

        return;
      }
    }

    throw new Error(`The path "${pathFromURL}" does not exist.`);
  }

  addMessage(text: CompilerMessage['text']): void {
    this.messages = [{ date: +new Date(), text }, ...this.messages];

    console.log(text);
  }

  afterCompilation(
    container: CompilerInputFileContainer,
    input: string,
    json: unknown,
    versionFromURL: string
  ): void {
    this.addMessage(
      `The path "${container.path}" was compiled in the ${versionFromURL} version.`
    );

    const $ = p.resolve(container.path, 'public/server.js');

    delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

    const compiledContainer: Container = __non_webpack_require__($).default;

    const addedContainer = this.containers[container.path];

    if (addedContainer) {
      addedContainer.inputs[input] = json;

      if (
        Object.keys(addedContainer.inputs).length === container.inputs.length
      ) {
        addedContainer.pages.forEach((page) => {
          page.context = { ...page.context, container: addedContainer };

          page.toHTML();

          if (typeof page.html === 'string') {
            helpers.writeFile(
              `${addedContainer.path}/public/${page.name}.html`,
              page.html
            );
          }

          delete page.context.container;

          this.addMessage(
            `The file "${addedContainer.path}/public/${page.name}.html" was created.`
          );
        });

        this.toJSON();

        addedContainer.inputs = {};
      }

      return;
    }

    compiledContainer.inputs[input] = json;
    compiledContainer.path = container.path;
    compiledContainer.version = versionFromURL;

    this.containers[container.path] = compiledContainer;
  }

  readInputFile() {
    return helpers.validateInputFromFile(
      types.CompilerInputFile,
      this.inputFileName
    );
  }

  readOutputFile() {
    return helpers.validateInputFromFile(
      types.CompilerOutputFile,
      this.outputFileName
    );
  }

  toJSON(): void {
    const outputFile: CompilerOutputFile = { containers: [] };

    for (const containerPath in this.containers) {
      const container = this.containers[containerPath];

      outputFile.containers = [...outputFile.containers, container.toJSON()];
    }

    helpers.writeFile(this.outputFileName, `${JSON.stringify(outputFile)}\n`);

    this.addMessage(`The file "${this.outputFileName}" was written.`);
  }
}

export default Compiler;
