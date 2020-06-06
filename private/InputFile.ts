import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { InputFile as T, InputFilePackage, } from '@redredsk/compiler/private/types/InputFile';

class InputFile {
  fileName: string;

  constructor (fileName: string = 'compiler.json') {
    this.fileName = fileName;
  }

  async packageByPath (path: t.TypeOf<typeof InputFilePackage>['path']): Promise<[ number, t.TypeOf<typeof InputFilePackage>, ] | undefined> {
    const inputFile = await this.readFile();

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.path === path) {
        return [ i, inputFilePackage, ];
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof T>> {
    const data = await readFile(this.fileName);

    return validateInput(T, JSON.parse(data));
  }

  writeFile (inputFile:t.TypeOf<typeof T>): void {
    const validatedInputFile = validateInput(T, inputFile);

    writeFile(this.fileName, `${JSON.stringify(validatedInputFile)}\n`);
  }
}

export default InputFile;
