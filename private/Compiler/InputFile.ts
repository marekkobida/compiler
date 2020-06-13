import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { InputFile as T, InputFilePackage, } from '@redredsk/types/private/InputFile';

class InputFile {
  $: t.TypeOf<typeof T> = { packages: [], };

  fileName: string;

  constructor (fileName: string = 'compiler.json') {
    this.fileName = fileName;

    this.readFile();
  }

  packageByPath (path: t.TypeOf<typeof InputFilePackage>['path']): t.TypeOf<typeof InputFilePackage> | undefined {
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
    let inputFile = JSON.parse(await readFile(this.fileName));

    const validatedInputFile = validateInput(T, inputFile);

    this.$ = validatedInputFile;

    return validatedInputFile;
  }

  writeFile (inputFile: t.TypeOf<typeof T> = this.$): void {
    const validatedInputFile = validateInput(T, inputFile);

    this.$ = validatedInputFile;

    writeFile(this.fileName, `${JSON.stringify(validatedInputFile)}\n`);
  }
}

export default InputFile;
