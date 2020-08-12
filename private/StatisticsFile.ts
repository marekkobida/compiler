import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import * as types from '@redredsk/types/private';
import * as t from 'io-ts';

class StatisticsFile {
  $: t.TypeOf<typeof types.StatisticsFile> = { requests: [], };

  fileName: string;

  constructor (fileName = 'statistics.json') {
    this.fileName = fileName;

    this.readFile();
  }

  async readFile (): Promise<t.TypeOf<typeof types.StatisticsFile>> {
    try {
      const statisticsFile = await readFile(this.fileName);

      const validatedStatisticsFile = validateInput(types.StatisticsFile, JSON.parse(statisticsFile));

      this.$ = validatedStatisticsFile;

      return validatedStatisticsFile;
    } catch (error) {
      return this.writeFile();
    }
  }

  writeFile (statisticsFile: t.TypeOf<typeof types.StatisticsFile> = this.$): t.TypeOf<typeof types.StatisticsFile> {
    const validatedStatisticsFile = validateInput(types.StatisticsFile, statisticsFile);

    writeFile(this.fileName, `${JSON.stringify(validatedStatisticsFile)}\n`);

    this.$ = validatedStatisticsFile;

    return validatedStatisticsFile;
  }
}

export default StatisticsFile;
