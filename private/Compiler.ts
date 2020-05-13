import * as t from 'io-ts';
import * as types from '@redred/compiler/private/types';
import InputFile from './compiler/InputFile';
import OutputFile from './compiler/OutputFile';
import addMessage from './compiler/addMessage';

type CompilerOutputFileContainer = t.TypeOf<
  typeof types.CompilerOutputFileContainer
>;

const webpack = __non_webpack_require__('webpack');

class Compiler {
  async compile(
    path: CompilerOutputFileContainer['path'],
    version: CompilerOutputFileContainer['version']
  ) {
    // 1.

    const inputFileContainer = await InputFile.containerByPath(path);

    if (!inputFileContainer) {
      throw new Error(
        `The path (\x1b[32m${path}\x1b[0m) does not exist in the input file.`
      );
    }

    let outputFileContainer = await OutputFile.containerByPath(path);

    if (outputFileContainer) {
      throw new Error(
        `The path (\x1b[32m${path}\x1b[0m) exists in the output file.`
      );
    }

    outputFileContainer = inputFileContainer;

    // 2.

    const outputFile = await OutputFile.read();

    outputFile.containers = [...outputFile.containers, outputFileContainer];

    OutputFile.write(outputFile);

    addMessage(
      `(\x1b[32m${path}\x1b[0m) The path was added to the compiler in the \x1b[32m${version}\x1b[0m version.`
    );

    // 3.

    for (let i = 0; i < outputFileContainer.filesToCompile.length; i += 1) {
      const containerFileToCompile = outputFileContainer.filesToCompile[i];

      delete __non_webpack_require__.cache[
        __non_webpack_require__.resolve(containerFileToCompile.path)
      ];

      webpack(
        __non_webpack_require__(containerFileToCompile.path)(
          inputFileContainer,
          version
        )
      ).watch({}, (left: Error, right: { toJson: () => unknown }) => {
        for (let ii = 0; ii < outputFile.containers.length; ii += 1) {
          const outputFileContainer = outputFile.containers[ii];

          if (outputFileContainer.path === inputFileContainer.path) {
            for (
              let iii = 0;
              iii < outputFileContainer.filesToCompile.length;
              iii += 1
            ) {
              const outputFileContainerFileToCompile =
                outputFileContainer.filesToCompile[iii];

              if (
                outputFileContainerFileToCompile.path ===
                containerFileToCompile.path
              ) {
                outputFileContainerFileToCompile.compiled = right.toJson();
              }
            }
          }
        }

        OutputFile.write(outputFile);

        addMessage(
          `(\x1b[32m${path}\x1b[0m) The path (\x1b[32m${containerFileToCompile.path}\x1b[0m) was compiled in the \x1b[32m${version}\x1b[0m version.`
        );
      });
    }
  }
}

export default new Compiler();
