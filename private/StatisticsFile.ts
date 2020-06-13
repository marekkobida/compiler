import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { StatisticsFile as T, } from '@redredsk/compiler/private/types/StatisticsFile';

class StatisticsFile {
  $: t.TypeOf<typeof T> = { requests: [], };

  fileName: string;

  constructor (fileName: string = 'statistics.json') {
    this.fileName = fileName;

    this.readFile();
  }

  async readFile (): Promise<t.TypeOf<typeof T>> {
    try {
      const statisticsFile = await readFile(this.fileName);

      const validatedStatisticsFile = validateInput(T, JSON.parse(statisticsFile));

      this.$ = validatedStatisticsFile;

      return validatedStatisticsFile;
    } catch (error) {
      this.writeFile();

      return this.readFile();
    }
  }

  writeFile (statisticsFile: t.TypeOf<typeof T> = this.$): void {
    const validatedStatisticsFile = validateInput(T, statisticsFile);

    this.$ = validatedStatisticsFile;

    writeFile(this.fileName, `${JSON.stringify(validatedStatisticsFile)}\n`);
  }
}

export default StatisticsFile;
