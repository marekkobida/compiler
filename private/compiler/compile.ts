import * as t from 'io-ts';
import * as types from '../../types';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import addMessage from './addMessage';

type CompilerOutputFileContainer = t.TypeOf<
  typeof types.CompilerOutputFileContainer
>;

const inputFile = new InputFile();
const outputFile = new OutputFile();

const webpack = __non_webpack_require__('webpack');

async function compile(
  path: CompilerOutputFileContainer['path'],
  version: CompilerOutputFileContainer['version']
) {
  if (outputFile.containerByPath(path)) {
    throw new Error(`The path "${path}" exists in the output file.`);
  }

  const inputFileContainer = await inputFile.containerByPath(path);

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

  outputFile.data.containers = [...outputFile.data.containers, container];

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
        `The path "${containerFileToCompile.path}" was compiled in the ${version} version.`
      );

      for (let ii = 0; ii < outputFile.data.containers.length; ii += 1) {
        const temporaryOutputFileContainer = outputFile.data.containers[ii];

        if (temporaryOutputFileContainer.path === inputFileContainer.path) {
          for (
            let iii = 0;
            iii < temporaryOutputFileContainer.filesToCompile.length;
            iii += 1
          ) {
            const temporaryOutputFileContainerFileToCompile =
              temporaryOutputFileContainer.filesToCompile[iii];

            if (
              temporaryOutputFileContainerFileToCompile.path ===
              containerFileToCompile.path
            ) {
              temporaryOutputFileContainerFileToCompile.compiled = right.toJson();
            }
          }
        }
      }

      outputFile.write();
    });
  }

  addMessage(
    `The path "${path}" was added to the compiler in the ${version} version.`
  );
}

export default compile;
