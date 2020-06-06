import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { InputFile as InputFileType, InputFilePackage, } from '@redredsk/compiler/private/types/InputFile';

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

  async readFile (): Promise<t.TypeOf<typeof InputFileType>> {
    const data = await readFile(this.fileName);

    return validateInput(InputFileType, JSON.parse(data));
  }

  writeFile (data:t.TypeOf<typeof InputFileType>): void {
    const validatedData = validateInput(InputFileType, data);

    writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default InputFile;
