import * as t from 'io-ts';
import CompiledContainer from './CompiledContainer';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import StatisticsFile from './StatisticsFile';
import path from 'path';
import { CompilerInputFilePackage, } from '@redredsk/compiler/private/types/CompilerInputFile';
import { CompilerOutputFilePackageCompiledFile, } from '@redredsk/compiler/private/types/CompilerOutputFile';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  inputFile: InputFile;

  outputFile: OutputFile;

  statisticsFile: StatisticsFile;

  constructor (inputFile: InputFile = new InputFile(), outputFile: OutputFile = new OutputFile(), statisticsFile: StatisticsFile = new StatisticsFile()) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.statisticsFile = statisticsFile;

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
        async (left: Error, right: { toJson: () => t.TypeOf<typeof CompilerOutputFilePackageCompiledFile>, }) => {
          const outputFilePackage  = await this.outputFile.packageByPath(path);

          if (outputFilePackage) {
            if (outputFilePackage.path === inputFilePackage.path) {
              let $ = false;

              for (let ii = 0; ii < outputFilePackage.compiledFiles.length; ii += 1) {
                let compilerOutputFilePackageCompiledFile = outputFilePackage.compiledFiles[ii];

                if (compilerOutputFilePackageCompiledFile.path === packageFileToCompile.path) {
                  outputFilePackage.compiledFiles[ii] = { ...right.toJson(), path: packageFileToCompile.path, };

                  $ = true;
                }
              }

              if (!$) {
                outputFilePackage.compiledFiles = [ ...outputFilePackage.compiledFiles, { ...right.toJson(), path: packageFileToCompile.path, }, ];
              }

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
