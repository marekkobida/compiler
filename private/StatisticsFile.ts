import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { StatisticsFile as T, } from '@redredsk/compiler/private/types/StatisticsFile';

class StatisticsFile {
  fileName: string;

  constructor (fileName: string = 'statistics.json') {
    this.fileName = fileName;
  }

  async readFile (): Promise<t.TypeOf<typeof T>> {
    const data = await readFile(this.fileName);

    return validateInput(T, JSON.parse(data));
  }

  writeFile (statisticsFile: t.TypeOf<typeof T>): void {
    const validatedStatisticsFile = validateInput(T, statisticsFile);

    writeFile(this.fileName, `${JSON.stringify(validatedStatisticsFile)}\n`);
  }
}

export default StatisticsFile;
