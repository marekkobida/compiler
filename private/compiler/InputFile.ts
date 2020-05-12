import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '../../types';

type CompilerInputFileContainer = t.TypeOf<
  typeof types.CompilerInputFileContainer
>;

class InputFile {
  name = 'compiler.json';

  async containerByPath(path: CompilerInputFileContainer['path']) {
    const inputFile = await this.read();

    const inputFileContainers = inputFile.containers;

    for (let i = 0; i < inputFileContainers.length; i += 1) {
      const inputFileContainer = inputFileContainers[i];

      if (inputFileContainer.path === path) {
        return inputFileContainer;
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
