import * as helpers from '@redred/helpers/server';
import * as types from '../../types';

const OUTPUT_FILE_NAME = 'compiled.json';

async function readOutputFile() {
  return helpers.validateInputFromFile(
    types.CompilerOutputFile,
    OUTPUT_FILE_NAME
  );
}

export { OUTPUT_FILE_NAME };

export default readOutputFile;
