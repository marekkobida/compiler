import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerOutputFile, CompilerOutputFilePackage, } from '@redredsk/compiler/private/types/CompilerOutputFile';

class OutputFile {
  fileName: string;

  constructor (fileName: string = 'compiled.json') {
    this.fileName = fileName;

    this.writeFile({ packages: [], });
  }

  async packageByPath (path: t.TypeOf<typeof CompilerOutputFilePackage>['path']): Promise<t.TypeOf<typeof CompilerOutputFilePackage> | undefined> {
    const outputFile = await this.readFile();

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return outputFilePackage;
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof CompilerOutputFile>> {
    const data = await readFile(this.fileName);

    return validateInput(CompilerOutputFile, JSON.parse(data));
  }

  writeFile (data: t.TypeOf<typeof CompilerOutputFile>): void {
    const validatedData = validateInput(CompilerOutputFile, data);

    writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default OutputFile;
