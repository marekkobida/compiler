import fs from 'fs';

import Validation from '@redredsk/helpers/private/types/Validation';
import * as types from '@redredsk/types/private';
import * as t from 'io-ts';

const validation = new Validation();

class CompilerOutputFile {
  $: t.TypeOf<typeof types.CompilerOutputFile> = { packages: [] };

  constructor(readonly fileName = 'compiled.json') {}

  packageByPath(
    path: t.TypeOf<typeof types.CompilerOutputFilePackage>['path'],
  ): t.TypeOf<typeof types.CompilerOutputFilePackage> | undefined {
    const outputFile = this.$;

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return outputFilePackage;
      }
    }
  }

  readFile(): t.TypeOf<typeof types.CompilerOutputFile> {
    const outputFile = fs.readFileSync(this.fileName, { encoding: 'utf-8' });

    const validatedOutputFile = validation.validateInput(
      JSON.parse(outputFile),
      types.CompilerOutputFile,
    );

    this.$ = validatedOutputFile;

    return validatedOutputFile;
  }

  writeFile(
    outputFile: t.TypeOf<typeof types.CompilerOutputFile> = this.$,
  ): t.TypeOf<typeof types.CompilerOutputFile> {
    const validatedOutputFile = validation.validateInput(
      outputFile,
      types.CompilerOutputFile,
    );

    fs.writeFileSync(this.fileName, JSON.stringify(validatedOutputFile));

    this.$ = validatedOutputFile;

    return validatedOutputFile;
  }
}

export default CompilerOutputFile;
