import * as helpers from '@redredsk/helpers/server';
import * as types from '@redredsk/compiler/private/types';

class InputFile {
  fileName = 'compiler.json';

  async packageByPath (path: types.typescript.CompilerInputFilePackage['path']): Promise<types.typescript.CompilerInputFilePackage> {
    const inputFile = await this.readFile();

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.path === path) {
        return inputFilePackage;
      }
    }

    throw new Error(`The package "${path}" does not exist in the input file.`);
  }

  async readFile (): Promise<types.typescript.CompilerInputFile> {
    const data = await helpers.readFile(this.fileName);

    let json;

    try {
      json = JSON.parse(data);
    } catch (error) {
      throw new Error(`The input file "${this.fileName}" is not valid.`);
    }

    return helpers.validateInput(types.CompilerInputFile, json);
  }
}

export default InputFile;
