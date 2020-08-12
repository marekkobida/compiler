import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import * as types from '@redredsk/types/private';
import * as t from 'io-ts';

class CompilerOutputFile {
  $: t.TypeOf<typeof types.CompilerOutputFile> = { packages: [], };

  fileName: string;

  constructor (fileName = 'compiled.json') {
    this.fileName = fileName;

    this.writeFile();
  }

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
    const outputFile = await readFile(this.fileName);

    const validatedOutputFile = validateInput(types.CompilerOutputFile, JSON.parse(outputFile));

    this.$ = validatedOutputFile;

    return validatedOutputFile;
  }

  writeFile (outputFile: t.TypeOf<typeof types.CompilerOutputFile> = this.$): t.TypeOf<typeof types.CompilerOutputFile> {
    const validatedOutputFile = validateInput(types.CompilerOutputFile, outputFile);

    writeFile(this.fileName, `${JSON.stringify(validatedOutputFile)}\n`);

    this.$ = validatedOutputFile;

    return validatedOutputFile;
  }
}

export default CompilerOutputFile;
