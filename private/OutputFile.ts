import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '@redred/compiler/private/types';

type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

type CompilerOutputFilePackage = t.TypeOf<
  typeof types.CompilerOutputFilePackage
>;

class OutputFile {
  name = 'compiled.json';

  async packageByPath(path: CompilerOutputFilePackage['path']) {
    const outputFile = await this.read();

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return outputFilePackage;
      }
    }
  }

  async read() {
    return await helpers.validateInputFromFile(
      types.CompilerOutputFile,
      this.name
    );
  }

  write(data: CompilerOutputFile) {
    const validatedData = helpers.validateInput(types.CompilerOutputFile, data);

    helpers.writeFile(this.name, `${JSON.stringify(validatedData)}\n`);
  }
}

export default OutputFile;
