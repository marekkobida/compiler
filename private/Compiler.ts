import * as t from 'io-ts';
import CompiledContainer from './CompiledContainer';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import StatisticsFile from './StatisticsFile';
import webpack from 'webpack';
import { InputFilePackage, } from '@redredsk/compiler/private/types/InputFile';

class Compiler {
  inputFile: InputFile;

  outputFile: OutputFile;

  statisticsFile: StatisticsFile;

  constructor (inputFile: InputFile = new InputFile(), outputFile: OutputFile = new OutputFile(), statisticsFile: StatisticsFile = new StatisticsFile()) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.statisticsFile = statisticsFile;
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

    outputFile.packages = [ ...outputFile.packages, { compiledFiles: [], path, version: inputFilePackage.version, }, ];

    this.outputFile.writeFile(outputFile);

    // 3.

    for (let i = 0; i < inputFilePackage.filesToCompile.length; i += 1) {
      const inputFilePackageFileToCompile = inputFilePackage.filesToCompile[i];

      const $ = (await import(/* webpackIgnore: true */ inputFilePackageFileToCompile.path)).default(inputFilePackage);

      $.plugins = [ ...$.plugins, new CompiledContainer(inputFilePackage, inputFilePackageFileToCompile, this.outputFile), ];

      webpack($).watch({}, () => {});
    }
  }
}

export default Compiler;
