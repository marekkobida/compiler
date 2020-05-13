import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '@redred/compiler/private/types';

type CompilerOutputFileType = t.TypeOf<typeof types.CompilerOutputFile>;

type CompilerOutputFileContainer = t.TypeOf<
  typeof types.CompilerOutputFileContainer
>;

class OutputFile {
  name = 'compiled.json';

  async containerByPath(path: CompilerOutputFileContainer['path']) {
    const outputFile = await this.read();

    const outputFileContainers = outputFile.containers;

    for (let i = 0; i < outputFileContainers.length; i += 1) {
      const outputFileContainer = outputFileContainers[i];

      if (outputFileContainer.path === path) {
        return outputFileContainer;
      }
    }
  }

  async read() {
    return await helpers.validateInputFromFile(
      types.CompilerOutputFile,
      this.name
    );
  }

  write(data: CompilerOutputFileType = { containers: [] }) {
    const validatedData = helpers.validateInput(types.CompilerOutputFile, data);

    helpers.writeFile(this.name, `${JSON.stringify(validatedData)}\n`);
  }
}

export default OutputFile;
