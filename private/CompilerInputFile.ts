import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import * as types from '@redredsk/types/private';
import * as t from 'io-ts';

class CompilerInputFile {
  $: t.TypeOf<typeof types.CompilerInputFile> = { packages: [], };

  fileName: string;

  constructor (fileName = 'compiler.json') {
    this.fileName = fileName;

    this.readFile();
  }

  packageByPath (path: t.TypeOf<typeof types.CompilerInputFilePackage>['path']): t.TypeOf<typeof types.CompilerInputFilePackage> | undefined {
    const inputFile = this.$;

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.path === path) {
        return inputFilePackage;
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof types.CompilerInputFile>> {
    const inputFile = await readFile(this.fileName);

    const validatedInputFile = validateInput(types.CompilerInputFile, JSON.parse(inputFile));

    this.$ = validatedInputFile;

    return validatedInputFile;
  }

  writeFile (inputFile: t.TypeOf<typeof types.CompilerInputFile> = this.$): t.TypeOf<typeof types.CompilerInputFile> {
    const validatedInputFile = validateInput(types.CompilerInputFile, inputFile);

    writeFile(this.fileName, `${JSON.stringify(validatedInputFile)}\n`);

    this.$ = validatedInputFile;

    return validatedInputFile;
  }
}

export default CompilerInputFile;
