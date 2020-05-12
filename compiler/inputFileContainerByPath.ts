import * as t from 'io-ts';
import * as types from '../../types';
import readInputFile from './readInputFile';

type CompilerInputFileContainer = t.TypeOf<
  typeof types.CompilerInputFileContainer
>;

async function inputFileContainerByPath(
  path: CompilerInputFileContainer['path']
) {
  const inputFile = await readInputFile();

  const inputFileContainers = inputFile.containers;

  for (let i = 0; i < inputFileContainers.length; i += 1) {
    const inputFileContainer = inputFileContainers[i];

    if (inputFileContainer.path === path) {
      return inputFileContainer;
    }
  }
}

export default inputFileContainerByPath;
