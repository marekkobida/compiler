import messages from '@redredsk/compiler/private/messages.json';
import * as types from '@redredsk/types/private';
import * as t from 'io-ts';
import webpack from 'webpack';

import CompilerInputFile from './CompilerInputFile';
import CompilerOutputFile from './CompilerOutputFile';

class Compiler {
  inputFile: CompilerInputFile;

  outputFile: CompilerOutputFile;

  constructor (inputFile: CompilerInputFile = new CompilerInputFile(), outputFile: CompilerOutputFile = new CompilerOutputFile()) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
  }

  compile (path: t.TypeOf<typeof types.CompilerInputFilePackage>['path']): void {
    // 1.

    const inputFilePackage = this.inputFile.packageByPath(path);

    if (!inputFilePackage) {
      throw new Error(messages.COMPILER_INPUT_FILE_PACKAGE_PATH_NOT_EXIST_IN_INPUT_FILE.replace(/\$1/, path));
    }

    const outputFilePackage  = this.outputFile.packageByPath(path);

    if (outputFilePackage) {
      throw new Error(messages.COMPILER_INPUT_FILE_PACKAGE_PATH_EXISTS_IN_OUTPUT_FILE.replace(/\$1/, path));
    }

    // 2.

    this.outputFile.$.packages = [ ...this.outputFile.$.packages, { compiledFiles: [], path, version: inputFilePackage.version, }, ];

    this.outputFile.writeFile();

    // 3.

    for (let i = 0; i < inputFilePackage.filesToCompile.length; i += 1) {
      const inputFilePackageFileToCompile = inputFilePackage.filesToCompile[i];

      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(`${process.cwd()}/${inputFilePackageFileToCompile.path}`)];

      const $ = __non_webpack_require__(`${process.cwd()}/${inputFilePackageFileToCompile.path}`)(inputFilePackage, inputFilePackageFileToCompile, this.outputFile);

      webpack($).watch({}, () => {});
    }
  }
}

export default Compiler;
