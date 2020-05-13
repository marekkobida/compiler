import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '@redred/compiler/private/types';
import Container from '@redred/pages/private/Container';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import addMessage from './addMessage';
import path from 'path';

type CompilerInputFilePackage = t.TypeOf<typeof types.CompilerInputFilePackage>;

type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

type CompilerOutputFilePackage = t.TypeOf<
  typeof types.CompilerOutputFilePackage
>;

const webpack = __non_webpack_require__('webpack');

class Compiler {
  inputFile = new InputFile();

  outputFile = new OutputFile();

  constructor() {
    this.outputFile.write({ packages: [] });

    this.compile('./packages/tiptravel.sk', 'development');
  }

  afterCompilation(
    inputFilePackage: CompilerInputFilePackage,
    outputFile: CompilerOutputFile,
    outputFilePackage: CompilerOutputFilePackage
  ) {
    if (
      inputFilePackage.filesToCompile.length ===
      outputFilePackage.filesToCompile.length
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
            container: compiledContainer,
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

          delete compiledContainerPage.context.container;
          delete compiledContainerPage.context.inputFilePackage;
          delete compiledContainerPage.context.outputFilePackage;

          addMessage(
            `The file "${inputFilePackage.path}/public/${compiledContainerPage.name}.html" was written.`
          );
        }

        outputFilePackage.container = compiledContainer.toJSON();

        this.outputFile.write(outputFile);

        outputFilePackage.filesToCompile = [];
      } catch (error) {
        addMessage([error.message, error.stack]);
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
      throw new Error(
        `The path "\x1b[32m${path}\x1b[0m" does not exist in the input file.`
      );
    }

    const outputFilePackage = await this.outputFile.packageByPath(path);

    if (outputFilePackage) {
      throw new Error(
        `The path "\x1b[32m${path}\x1b[0m" exists in the output file.`
      );
    }

    // 2.

    const outputFile = await this.outputFile.read();

    outputFile.packages = [
      ...outputFile.packages,
      { filesToCompile: [], path, version },
    ];

    this.outputFile.write(outputFile);

    addMessage(
      `The path "\x1b[32m${path}\x1b[0m" was added to the compiler in the \x1b[32m${version}\x1b[0m version.`
    );

    // 3.

    const packageFilesToCompile = inputFilePackage.filesToCompile;

    for (let i = 0; i < packageFilesToCompile.length; i += 1) {
      const packageFileToCompile = packageFilesToCompile[i];

      delete __non_webpack_require__.cache[
        __non_webpack_require__.resolve(packageFileToCompile.path)
      ];

      webpack(
        __non_webpack_require__(packageFileToCompile.path)(
          inputFilePackage,
          version
        )
      ).watch({}, (left: Error, right: { toJson: () => unknown }) => {
        for (let ii = 0; ii < outputFile.packages.length; ii += 1) {
          const outputFilePackage = outputFile.packages[ii];

          if (outputFilePackage.path === inputFilePackage.path) {
            outputFilePackage.filesToCompile = [
              ...outputFilePackage.filesToCompile,
              {
                compiled: right.toJson(),
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

        addMessage(
          `The path "\x1b[32m${packageFileToCompile.path}\x1b[0m" was compiled in the \x1b[32m${version}\x1b[0m version.`
        );
      });
    }
  }
}

export default Compiler;
