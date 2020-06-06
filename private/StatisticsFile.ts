import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerStatisticsFile, } from '@redredsk/compiler/private/types/CompilerStatisticsFile';

class StatisticsFile {
  fileName: string;

  constructor (fileName: string = 'statistics.json') {
    this.fileName = fileName;

    this.writeFile({ requests: [], });
  }

  async readFile (): Promise<t.TypeOf<typeof CompilerStatisticsFile>> {
    const data = await readFile(this.fileName);

    return validateInput(CompilerStatisticsFile, JSON.parse(data));
  }

  writeFile (data: t.TypeOf<typeof CompilerStatisticsFile>): void {
    const validatedData = validateInput(CompilerStatisticsFile, data);

    writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default StatisticsFile;
