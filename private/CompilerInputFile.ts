import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerInputFile as T, CompilerInputFilePackage, } from '@redredsk/types/private/CompilerInputFile';

class CompilerInputFile {
  $: t.TypeOf<typeof T> = { packages: [], };

  fileName: string;

  constructor (fileName: string = 'compiler.json') {
    this.fileName = fileName;

    this.readFile();
  }

  packageByPath (path: t.TypeOf<typeof CompilerInputFilePackage>['path']): t.TypeOf<typeof CompilerInputFilePackage> | undefined {
    const inputFile = this.$;

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.path === path) {
        return inputFilePackage;
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof T>> {
    const inputFile = await readFile(this.fileName);

    const validatedInputFile = validateInput(T, JSON.parse(inputFile));

    this.$ = validatedInputFile;

    return validatedInputFile;
  }

  writeFile (inputFile: t.TypeOf<typeof T> = this.$): void {
    const validatedInputFile = validateInput(T, inputFile);

    this.$ = validatedInputFile;

    writeFile(this.fileName, `${JSON.stringify(validatedInputFile)}\n`);
  }
}

export default CompilerInputFile;
