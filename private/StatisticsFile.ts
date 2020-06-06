import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { StatisticsFile as StatisticsFileType, } from '@redredsk/compiler/private/types/StatisticsFile';

class StatisticsFile {
  fileName: string;

  constructor (fileName: string = 'statistics.json') {
    this.fileName = fileName;

    this.writeFile({ requests: [], });
  }

  async readFile (): Promise<t.TypeOf<typeof StatisticsFileType>> {
    const data = await readFile(this.fileName);

    return validateInput(StatisticsFileType, JSON.parse(data));
  }

  writeFile (data: t.TypeOf<typeof StatisticsFileType>): void {
    const validatedData = validateInput(StatisticsFileType, data);

    writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default StatisticsFile;
