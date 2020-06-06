import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { OutputFile as T, OutputFilePackage, } from '@redredsk/compiler/private/types/OutputFile';

class OutputFile {
  fileName: string;

  constructor (fileName: string = 'compiled.json') {
    this.fileName = fileName;

    this.writeFile({ packages: [], });
  }

  async packageByPath (path: t.TypeOf<typeof OutputFilePackage>['path']): Promise<[ number, t.TypeOf<typeof OutputFilePackage>, ] | undefined> {
    const outputFile = await this.readFile();

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return [ i, outputFilePackage, ];
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof T>> {
    const data = await readFile(this.fileName);

    return validateInput(T, JSON.parse(data));
  }

  writeFile (outputFile: t.TypeOf<typeof T>): void {
    const validatedOutputFile = validateInput(T, outputFile);

    writeFile(this.fileName, `${JSON.stringify(validatedOutputFile)}\n`);
  }
}

export default OutputFile;
