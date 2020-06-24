import * as t from 'io-ts';
import CompilerCompiledContainer from './CompilerCompiledContainer';
import CompilerInputFile from './CompilerInputFile';
import CompilerOutputFile from './CompilerOutputFile';
import webpack from 'webpack';
import { CompilerInputFilePackage, } from '@redredsk/types/private/CompilerInputFile';

class Compiler {
  inputFile: CompilerInputFile;

  outputFile: CompilerOutputFile;

  constructor (inputFile: CompilerInputFile = new CompilerInputFile(), outputFile: CompilerOutputFile = new CompilerOutputFile()) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
  }

  async compile (path: t.TypeOf<typeof CompilerInputFilePackage>['path']): Promise<void> {
    // 1.

    const inputFilePackage = this.inputFile.packageByPath(path);

    if (!inputFilePackage) {
      throw new Error(`The package "${path}" does not exist in the input file.`);
    }

    const outputFilePackage  = this.outputFile.packageByPath(path);

    if (outputFilePackage) {
      throw new Error(`The package "${path}" exists in the output file.`);
    }

    // 2.

    this.outputFile.$.packages = [ ...this.outputFile.$.packages, { compiledFiles: [], path, version: inputFilePackage.version, }, ];

    this.outputFile.writeFile();

    // 3.

    for (let i = 0; i < inputFilePackage.filesToCompile.length; i += 1) {
      const inputFilePackageFileToCompile = inputFilePackage.filesToCompile[i];

      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(inputFilePackageFileToCompile.path)];

      const $ = __non_webpack_require__(inputFilePackageFileToCompile.path)(inputFilePackage);

      $.plugins = [ ...$.plugins, new CompilerCompiledContainer(inputFilePackage, inputFilePackageFileToCompile, this.outputFile), ];

      webpack($).watch({}, () => {});
    }
  }
}

export default Compiler;
