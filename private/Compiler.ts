import * as t from 'io-ts';
import CompiledContainer from './CompiledContainer';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import path from 'path';
import { CompilerInputFilePackage, } from '@redredsk/compiler/private/types/CompilerInputFile';

process.chdir(process.mainModule.path);

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

  async compile (path: t.TypeOf<typeof CompilerInputFilePackage>['path']) {
    // 1.

    const inputFilePackage = await this.inputFile.packageByPath(path);

    if (!inputFilePackage) {
      throw new Error(`The package "${path}" does not exist in the input file.`);
    }

    const outputFilePackage  = await this.outputFile.packageByPath(path);

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
          for (let ii = 0; ii < outputFile.packages.length; ii += 1) {
            const outputFilePackage = outputFile.packages[ii];

            if (outputFilePackage.path === inputFilePackage.path) {
              outputFilePackage.compiledFiles = [ ...outputFilePackage.compiledFiles, { ...right.toJson(), path: packageFileToCompile.path, }, ];

              new CompiledContainer(inputFilePackage, outputFilePackage);

              this.outputFile.writeFile(outputFile);
            }
          }
        }
      );
    }
  }
}

export default Compiler;
