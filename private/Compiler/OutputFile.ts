import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { OutputFile as T, OutputFilePackage, } from '@redredsk/compiler/private/types/OutputFile';

class OutputFile {
  $: t.TypeOf<typeof T> = { packages: [], };

  fileName: string;

  constructor (fileName: string = 'compiled.json') {
    this.fileName = fileName;

    this.writeFile();
  }

  packageByPath (path: t.TypeOf<typeof OutputFilePackage>['path']): t.TypeOf<typeof OutputFilePackage> | undefined {
    const outputFile = this.$;

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return outputFilePackage;
      }
    }
  }

  async readFile (): Promise<t.TypeOf<typeof T>> {
    const outputFile = await readFile(this.fileName);

    const validatedOutputFile = validateInput(T, JSON.parse(outputFile));

    this.$ = validatedOutputFile;

    return validatedOutputFile;
  }

  writeFile (outputFile: t.TypeOf<typeof T> = this.$): void {
    const validatedOutputFile = validateInput(T, outputFile);

    this.$ = validatedOutputFile;

    writeFile(this.fileName, `${JSON.stringify(validatedOutputFile)}\n`);
  }
}

export default OutputFile;
