import * as helpers from '@redred/helpers/server';
import * as types from '../../types';

const INPUT_FILE_NAME = 'compiler.json';

async function readInputFile() {
  return helpers.validateInputFromFile(
    types.CompilerInputFile,
    INPUT_FILE_NAME
  );
}

export { INPUT_FILE_NAME };

export default readInputFile;
