import * as helpers from '@redredsk/helpers/server';
import * as types from '@redredsk/compiler/private/types';

class InputFile {
  name = 'compiler.json';

  async packageByPath (path: types.typescript.CompilerInputFilePackage['path']) {
    const inputFile = await this.read();

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.path === path) {
        return inputFilePackage;
      }
    }
  }

  async read () {
    return await helpers.validateInputFromFile(
      types.CompilerInputFile,
      this.name
    );
  }
}

export default InputFile;
