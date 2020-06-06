import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { OutputFile as OutputFileType, OutputFilePackage, } from '@redredsk/compiler/private/types/OutputFile';

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

  async readFile (): Promise<t.TypeOf<typeof OutputFileType>> {
    const data = await readFile(this.fileName);

    return validateInput(OutputFileType, JSON.parse(data));
  }

  writeFile (data: t.TypeOf<typeof OutputFileType>): void {
    const validatedData = validateInput(OutputFileType, data);

    writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default OutputFile;
