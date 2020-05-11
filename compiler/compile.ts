import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '../../types';
import addMessage from './addMessage';
// import afterCompilation from './afterCompilation';
import containerByPath from './containerByPath';
import inputFileContainerByPath from './inputFileContainerByPath';
import { OUTPUT_FILE_NAME } from './readOutputFile';

const webpack = __non_webpack_require__('webpack');

type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

type CompilerOutputFileContainer = t.TypeOf<
  typeof types.CompilerOutputFileContainer
>;

const outputFile: CompilerOutputFile = { containers: [] };

async function compile(path: string, version: string) {
  if (containerByPath(path)) {
    throw new Error(`The path "${path}" exists in the compiler.`);
  }

  const inputFileContainer = await inputFileContainerByPath(path);

  if (!inputFileContainer) {
    throw new Error(`The path "${path}" does not exist in the input file.`);
  }

  const container: CompilerOutputFileContainer = {
    filesToCompile: [],
    path,
    version,
  };

  for (let i = 0; i < inputFileContainer.filesToCompile.length; i += 1) {
    const inputFileContainerFileToCompile =
      inputFileContainer.filesToCompile[i];

    container.filesToCompile = [
      ...container.filesToCompile,
      { ...inputFileContainerFileToCompile, compiled: null },
    ];
  }

  outputFile.containers = [...outputFile.containers, container];

  for (let i = 0; i < container.filesToCompile.length; i += 1) {
    const containerFileToCompile = container.filesToCompile[i];

    delete __non_webpack_require__.cache[
      __non_webpack_require__.resolve(containerFileToCompile.path)
    ];

    webpack(
      __non_webpack_require__(containerFileToCompile.path)(
        inputFileContainer,
        version
      )
    ).watch({}, (left: Error, right: { toJson: () => unknown }) => {
      addMessage(
        `The file "${containerFileToCompile.path}" was compiled in the ${version} version.`
      );

      for (let ii = 0; ii < outputFile.containers.length; ii += 1) {
        const c = outputFile.containers[ii];

        if (c.path === inputFileContainer.path) {
          for (let iii = 0; iii < c.filesToCompile.length; iii += 1) {
            const f = c.filesToCompile[iii];

            if (f.path === containerFileToCompile.path) {
              f.compiled = right.toJson();
            }
          }
        }
      }

      helpers.writeFile(OUTPUT_FILE_NAME, `${JSON.stringify(outputFile)}\n`);

      // afterCompilation(inputFileContainer, () => (containers = []), version);
    });
  }

  addMessage(
    `The path "${path}" was added to the compiler in the ${version} version.`
  );
}

export { outputFile };

export default compile;
