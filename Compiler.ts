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
  containers: { [containerPath: string]: Container } = {};

  inputFileName: string = 'compiler.json';

  messages: CompilerMessages = [];

  outputFileName: string = 'compiled.json';

  async compile(
    pathFromRequestedURL: CompilerInputFileContainer['path'],
    versionFromRequestedURL: string
  ) {
    if (this.containers[pathFromRequestedURL]) {
      throw new Error(
        `The path from the requested URL "${pathFromRequestedURL}" exists in the compiler.`
      );
    }

    const inputFile = await this.readInputFile();

    const inputFileContainers = inputFile.containers;

    for (let i = 0; i < inputFileContainers.length; i += 1) {
      const inputFileContainer = inputFileContainers[i];

      if (pathFromRequestedURL === inputFileContainer.path) {
        const inputFileContainerInputs = inputFileContainer.inputs;

        for (let i = 0; i < inputFileContainerInputs.length; i += 1) {
          const inputFileContainerInput = inputFileContainer.inputs[i];

          delete __non_webpack_require__.cache[
            __non_webpack_require__.resolve(inputFileContainerInput)
          ];

          webpack(
            __non_webpack_require__(inputFileContainerInput)(
              inputFileContainer,
              versionFromRequestedURL
            )
          ).watch({}, (left: Error, right: { toJson: () => unknown }) => {
            try {
              this.afterCompilation(
                inputFileContainer,
                inputFileContainerInput,
                right.toJson(),
                versionFromRequestedURL
              );
            } catch (error) {
              this.addMessage([error.message, error.stack]);
            }
          });
        }

        this.addMessage(
          `The path from the requested URL "${pathFromRequestedURL}" was added to the compiler in the ${versionFromRequestedURL} version.`
        );

        return;
      }
    }

    throw new Error(`The path "${pathFromRequestedURL}" does not exist.`);
  }

  addMessage(text: CompilerMessage['text']): void {
    this.messages = [{ date: +new Date(), text }, ...this.messages];
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

  async readInputFile() {
    return helpers.validateInputFromFile(
      types.CompilerInputFile,
      this.inputFileName
    );
  }

  async readOutputFile() {
    return helpers.validateInputFromFile(
      types.CompilerOutputFile,
      this.outputFileName
    );
  }

  toJSON() {
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
