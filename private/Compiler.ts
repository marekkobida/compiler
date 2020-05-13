import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '@redred/compiler/private/types';
import Container from '@redred/pages/private/Container';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import path from 'path';

type CompilerInputFilePackage = t.TypeOf<typeof types.CompilerInputFilePackage>;

type CompilerMessage = t.TypeOf<typeof types.CompilerMessage>;

type CompilerMessages = t.TypeOf<typeof types.CompilerMessages>;

type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

type CompilerOutputFilePackage = t.TypeOf<
  typeof types.CompilerOutputFilePackage
>;

const webpack = __non_webpack_require__('webpack');

class Compiler {
  inputFile = new InputFile();

  messages: CompilerMessages = [];

  outputFile = new OutputFile();

  constructor() {
    this.outputFile.write({ packages: [] });

    this.compile('./packages/compiler', 'development');
  }

  addMessage(text: CompilerMessage['text']) {
    this.messages = [{ date: +new Date(), text }, ...this.messages];

    console.log(text);

    return this.messages;
  }

  afterCompilation(
    inputFilePackage: CompilerInputFilePackage,
    outputFile: CompilerOutputFile,
    outputFilePackage: CompilerOutputFilePackage
  ) {
    if (
      inputFilePackage.filesToCompile.length ===
      outputFilePackage.compiledFiles.length
    ) {
      try {
        const $ = path.resolve(inputFilePackage.path, 'public/server.js');

        delete __non_webpack_require__.cache[
          __non_webpack_require__.resolve($)
        ];

        const compiledContainer: Container = __non_webpack_require__($).default;

        for (let i = 0; i < compiledContainer.pages.length; i += 1) {
          const compiledContainerPage = compiledContainer.pages[i];

          compiledContainerPage.context = {
            ...compiledContainerPage.context,
            compiledContainer,
            inputFilePackage,
            outputFilePackage,
          };

          compiledContainerPage.toHTML();

          if (typeof compiledContainerPage.html === 'string') {
            helpers.writeFile(
              `${inputFilePackage.path}/public/${compiledContainerPage.name}.html`,
              compiledContainerPage.html
            );
          }

          this.addMessage(
            `The file "${inputFilePackage.path}/public/${compiledContainerPage.name}.html" was written.`
          );
        }

        outputFilePackage.compiledContainer = compiledContainer.toJSON();

        this.outputFile.write(outputFile);

        outputFilePackage.compiledFiles = [];
      } catch (error) {
        this.addMessage([error.message, error.stack]);
      }
    }
  }

  async compile(
    path: CompilerInputFilePackage['path'],
    version: CompilerInputFilePackage['version']
  ) {
    // 1.

    const inputFilePackage = await this.inputFile.packageByPath(path);

    if (!inputFilePackage) {
      throw new Error(`The path "${path}" does not exist in the input file.`);
    }

    const outputFilePackage = await this.outputFile.packageByPath(path);

    if (outputFilePackage) {
      throw new Error(`The path "${path}" exists in the output file.`);
    }

    // 2.

    const outputFile = await this.outputFile.read();

    outputFile.packages = [
      ...outputFile.packages,
      { compiledFiles: [], path, version },
    ];

    this.outputFile.write(outputFile);

    // 3.

    for (let i = 0; i < inputFilePackage.filesToCompile.length; i += 1) {
      const packageFileToCompile = inputFilePackage.filesToCompile[i];

      delete __non_webpack_require__.cache[
        __non_webpack_require__.resolve(packageFileToCompile.path)
      ];

      webpack(
        __non_webpack_require__(packageFileToCompile.path)(
          inputFilePackage,
          version
        )
      ).watch(
        {},
        (left: Error, right: { toJson: () => Record<string, unknown> }) => {
          for (let ii = 0; ii < outputFile.packages.length; ii += 1) {
            const outputFilePackage = outputFile.packages[ii];

            if (outputFilePackage.path === inputFilePackage.path) {
              outputFilePackage.compiledFiles = [
                ...outputFilePackage.compiledFiles,
                {
                  ...right.toJson(),
                  path: packageFileToCompile.path,
                },
              ];

              this.afterCompilation(
                inputFilePackage,
                outputFile,
                outputFilePackage
              );
            }
          }

          this.addMessage(
            `The path "${packageFileToCompile.path}" was compiled in the ${version} version.`
          );
        }
      );
    }
  }
}

export default Compiler;
