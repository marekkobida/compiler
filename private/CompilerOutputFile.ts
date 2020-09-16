import fs from 'fs';

import validateInput from '@redredsk/helpers/private/types/validateInput';
import * as types from '@redredsk/types/private';
import * as t from 'io-ts';

class CompilerOutputFile {
  $: t.TypeOf<typeof types.CompilerOutputFile> = { packages: [], };

  constructor (readonly fileName = 'compiled.json') {}

  packageByPath (path: t.TypeOf<typeof types.CompilerOutputFilePackage>['path']): t.TypeOf<typeof types.CompilerOutputFilePackage> | undefined {
    const outputFile = this.$;

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return outputFilePackage;
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof types.CompilerOutputFile>> {
    const outputFile = fs.readFileSync(this.fileName, { encoding: 'utf-8', });

    const validatedOutputFile = validateInput(types.CompilerOutputFile, JSON.parse(outputFile));

    this.$ = validatedOutputFile;

    return validatedOutputFile;
  }

  async writeFile (outputFile: t.TypeOf<typeof types.CompilerOutputFile> = this.$): Promise<t.TypeOf<typeof types.CompilerOutputFile>> {
    const validatedOutputFile = validateInput(types.CompilerOutputFile, outputFile);

    fs.writeFileSync(this.fileName, JSON.stringify(validatedOutputFile));

    this.$ = validatedOutputFile;

    return validatedOutputFile;
  }
}

export default CompilerOutputFile;
