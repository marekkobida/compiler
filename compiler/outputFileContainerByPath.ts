import * as t from 'io-ts';
import * as types from '../../types';
import { outputFile } from './compile';

type CompilerOutputFileContainer = t.TypeOf<
  typeof types.CompilerOutputFileContainer
>;

function outputFileContainerByPath(path: CompilerOutputFileContainer['path']) {
  const outputFileContainers = outputFile.containers;

  for (let i = 0; i < outputFileContainers.length; i += 1) {
    const outputFileContainer = outputFileContainers[i];

    if (outputFileContainer.path === path) {
      return outputFileContainer;
    }
  }
}

export default outputFileContainerByPath;
