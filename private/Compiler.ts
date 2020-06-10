import * as t from 'io-ts';
import CompiledContainer from './CompiledContainer';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import StatisticsFile from './StatisticsFile';
import webpack from 'webpack';
import { InputFilePackage, InputFilePackageFileToCompile, } from '@redredsk/compiler/private/types/InputFile';
import { OutputFilePackageCompiledFile, } from '@redredsk/compiler/private/types/OutputFile';

class Compiler {
  inputFile: InputFile;

  outputFile: OutputFile;

  statisticsFile: StatisticsFile;

  constructor (inputFile: InputFile = new InputFile(), outputFile: OutputFile = new OutputFile(), statisticsFile: StatisticsFile = new StatisticsFile()) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.statisticsFile = statisticsFile;
  }

  afterCompilation (inputFilePackage: t.TypeOf<typeof InputFilePackage>, inputFilePackageFileToCompile: t.TypeOf<typeof InputFilePackageFileToCompile>) {
    return async (left: Error, right: { toJson: () => t.TypeOf<typeof OutputFilePackageCompiledFile>, }): Promise<void> => {
      const outputFilePackage  = await this.outputFile.packageByPath(inputFilePackage.path);

      if (outputFilePackage) {
        if (outputFilePackage[1].path === inputFilePackage.path) {
          // 1.

          let $ = false;

          for (let ii = 0; ii < outputFilePackage[1].compiledFiles.length; ii += 1) {
            let outputFilePackageCompiledFile = outputFilePackage[1].compiledFiles[ii];

            if (outputFilePackageCompiledFile.path === inputFilePackageFileToCompile.path) {
              outputFilePackage[1].compiledFiles[ii] = { ...right.toJson(), path: inputFilePackageFileToCompile.path, };

              $ = true;
            }
          }

          if (!$) {
            outputFilePackage[1].compiledFiles = [ ...outputFilePackage[1].compiledFiles, { ...right.toJson(), path: inputFilePackageFileToCompile.path, }, ];
          }

          // 2.

          const compiledContainer = new CompiledContainer();

          await compiledContainer.test(inputFilePackage, outputFilePackage[1]);

          // 3.

          const outputFile = await this.outputFile.readFile();

          outputFile.packages[outputFilePackage[0]] = outputFilePackage[1];

          this.outputFile.writeFile(outputFile);
        }
      }
    };
  }

  async compile (path: t.TypeOf<typeof InputFilePackage>['path']): Promise<void> {
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

    outputFile.packages = [ ...outputFile.packages, { compiledFiles: [], path, version: inputFilePackage[1].version, }, ];

    this.outputFile.writeFile(outputFile);

    // 3.

    for (let i = 0; i < inputFilePackage[1].filesToCompile.length; i += 1) {
      const inputFilePackageFileToCompile = inputFilePackage[1].filesToCompile[i];

      const w = webpack((await import(/* webpackIgnore: true */ inputFilePackageFileToCompile.path)).default(inputFilePackage[1]));

      w.watch(
        {
          aggregateTimeout: 500,
          ignored: 'node_modules',
          poll: 1000,
        },
        this.afterCompilation(inputFilePackage[1], inputFilePackageFileToCompile)
      );
    }
  }
}

export default Compiler;
