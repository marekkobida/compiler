import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import path from 'path';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerInputFilePackage, } from '@redredsk/compiler/private/types/CompilerInputFile';
import { CompilerOutputFilePackage, } from '@redredsk/compiler/private/types/CompilerOutputFile';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  inputFile: InputFile;

  outputFile: OutputFile;

  constructor (inputFile: InputFile = new InputFile(), outputFile: OutputFile = new OutputFile()) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;

    this.outputFile.writeFile({ packages: [], });

    this.compile('./packages/compiler');
  }

  private afterCompilation (inputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>, outputFilePackage: t.TypeOf<typeof CompilerOutputFilePackage>) {
    try {
      const $ = path.resolve(inputFilePackage.path, 'public/server.js');

      delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

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
          writeFile(`${inputFilePackage.path}/public/${compiledContainerPage.name}.html`, compiledContainerPage.html);

          console.log(`The file "${inputFilePackage.path}/public/${compiledContainerPage.name}.html" was written.`);
        }
      }

      outputFilePackage.compiledContainer = compiledContainer.toJSON();
    } catch (error) {
      console.log([ error.message, error.stack, ]);
    }
  }

  async compile (path: t.TypeOf<typeof CompilerInputFilePackage>['path']) {
    // 1.

    const inputFilePackage = await this.inputFile.packageByPath(path);

    let outputFilePackage;

    try {
      outputFilePackage  = await this.outputFile.packageByPath(path);
    } catch (error) {

    }

    if (outputFilePackage) {
      throw new Error(`The package "${path}" exists in the output file.`);
    }

    // 2.

    const outputFile = await this.outputFile.readFile();

    outputFile.packages = [ ...outputFile.packages, { compiledFiles: [], path, version: inputFilePackage.version, }, ];

    this.outputFile.writeFile(outputFile);

    // 3.

    for (let i = 0; i < inputFilePackage.filesToCompile.length; i += 1) {
      const packageFileToCompile = inputFilePackage.filesToCompile[i];

      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(packageFileToCompile.path)];

      const w = webpack(__non_webpack_require__(packageFileToCompile.path)(inputFilePackage));

      w.watch(
        {},
        (left: Error, right: { toJson: () => Record<string, unknown> }) => {
          console.log(`The file "${packageFileToCompile.path}" was compiled in the ${inputFilePackage.version} version.`);

          for (let ii = 0; ii < outputFile.packages.length; ii += 1) {
            const outputFilePackage = outputFile.packages[ii];

            if (outputFilePackage.path === inputFilePackage.path) {
              console.log(typeof right.toJson().assets, right.toJson().assets, Object.prototype.toString.call(right.toJson().assets));
              console.log('t', { assets: right.toJson().assets, });
              outputFilePackage.compiledFiles = [ ...outputFilePackage.compiledFiles, { ...right.toJson(), path: packageFileToCompile.path, }, ];

              if (inputFilePackage.filesToCompile.length === outputFilePackage.compiledFiles.length) {
                this.afterCompilation(inputFilePackage, outputFilePackage);

                this.outputFile.writeFile(outputFile);

                outputFilePackage.compiledFiles = [];
              }
            }
          }
        }
      );
    }
  }
}

export default Compiler;
