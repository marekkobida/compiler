import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { StatisticsFile as T, } from '@redredsk/types/private/StatisticsFile';

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
      return this.writeFile();
    }
  }

  writeFile (statisticsFile: t.TypeOf<typeof T> = this.$): t.TypeOf<typeof T> {
    const validatedStatisticsFile = validateInput(T, statisticsFile);

    writeFile(this.fileName, `${JSON.stringify(validatedStatisticsFile)}\n`);

    this.$ = validatedStatisticsFile;

    return validatedStatisticsFile;
  }
}

export default StatisticsFile;
