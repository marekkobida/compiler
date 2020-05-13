import * as helpers from '@redredsk/helpers/server';
import * as t from 'io-ts';
import * as types from '@redredsk/compiler/private/types';

type CompilerInputFilePackage = t.TypeOf<typeof types.CompilerInputFilePackage>;

class InputFile {
  name = 'compiler.json';

  async packageByPath(path: CompilerInputFilePackage['path']) {
    const inputFile = await this.read();

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.path === path) {
        return inputFilePackage;
      }
    }
  }

  async read() {
    return await helpers.validateInputFromFile(
      types.CompilerInputFile,
      this.name
    );
  }
}

export default InputFile;
