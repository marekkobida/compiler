import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerInputFile, CompilerInputFilePackage, } from '@redredsk/compiler/private/types/CompilerInputFile';

class InputFile {
  fileName: string;

  constructor (fileName: string = 'compiler.json') {
    this.fileName = fileName;
  }

  async packageByPath (path: t.TypeOf<typeof CompilerInputFilePackage>['path']): Promise<t.TypeOf<typeof CompilerInputFilePackage> | undefined> {
    const inputFile = await this.readFile();

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.path === path) {
        return inputFilePackage;
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof CompilerInputFile>> {
    const data = await readFile(this.fileName);

    return validateInput(CompilerInputFile, JSON.parse(data));
  }

  writeFile (data:t.TypeOf<typeof CompilerInputFile>): void {
    const validatedData = validateInput(CompilerInputFile, data);

    writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default InputFile;
