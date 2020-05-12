import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '@redred/compiler/private/types';

type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

type CompilerOutputFileContainer = t.TypeOf<
  typeof types.CompilerOutputFileContainer
>;

class OutputFile {
  data: CompilerOutputFile = { containers: [] };

  name = 'compiled.json';

  containerByPath(path: CompilerOutputFileContainer['path']) {
    const outputFileContainers = this.data.containers;

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

  write() {
    helpers.writeFile(this.name, `${JSON.stringify(this.data)}\n`);
  }
}

export default OutputFile;
