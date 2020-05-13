import * as t from 'io-ts';
import * as types from '@redred/compiler/private/types';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import addMessage from './addMessage';

type CompilerOutputFilePackage = t.TypeOf<
  typeof types.CompilerOutputFilePackage
>;

const webpack = __non_webpack_require__('webpack');

class Compiler {
  inputFile = new InputFile();

  outputFile = new OutputFile();

  constructor() {
    this.outputFile.write({ packages: [] });

    this.compile('./packages/compiler', 'development');
  }

  async compile(
    path: CompilerOutputFilePackage['path'],
    version: CompilerOutputFilePackage['version']
  ) {
    // 1.

    const inputFilePackage = await this.inputFile.packageByPath(path);

    if (!inputFilePackage) {
      throw new Error(
        `The path "\x1b[32m${path}\x1b[0m" does not exist in the input file.`
      );
    }

    let outputFilePackage = await this.outputFile.packageByPath(path);

    if (outputFilePackage) {
      throw new Error(
        `The path "\x1b[32m${path}\x1b[0m" exists in the output file.`
      );
    }

    outputFilePackage = inputFilePackage;

    // 2.

    const outputFile = await this.outputFile.read();

    outputFile.packages = [...outputFile.packages, outputFilePackage];

    this.outputFile.write(outputFile);

    addMessage(
      `The path "\x1b[32m${path}\x1b[0m" was added to the compiler in the \x1b[32m${version}\x1b[0m version.`
    );

    // 3.

    const packageFilesToCompile = outputFilePackage.filesToCompile;

    for (let i = 0; i < packageFilesToCompile.length; i += 1) {
      const packageFileToCompile = packageFilesToCompile[i];

      delete __non_webpack_require__.cache[
        __non_webpack_require__.resolve(packageFileToCompile.path)
      ];

      webpack(
        __non_webpack_require__(packageFileToCompile.path)(
          inputFilePackage,
          version
        )
      ).watch({}, (left: Error, right: { toJson: () => unknown }) => {
        for (let ii = 0; ii < outputFile.packages.length; ii += 1) {
          const outputFilePackage = outputFile.packages[ii];

          // ?
          outputFilePackage.container = {
            id: -1,
            name: '',
            pages: [],
          };

          if (outputFilePackage.path === inputFilePackage.path) {
            for (
              let iii = 0;
              iii < outputFilePackage.filesToCompile.length;
              iii += 1
            ) {
              const outputFilePackageFileToCompile =
                outputFilePackage.filesToCompile[iii];

              if (
                outputFilePackageFileToCompile.path ===
                packageFileToCompile.path
              ) {
                outputFilePackageFileToCompile.compiled = right.toJson();
              }
            }
          }
        }

        this.outputFile.write(outputFile);

        addMessage(
          `The path "\x1b[32m${packageFileToCompile.path}\x1b[0m" was compiled in the \x1b[32m${version}\x1b[0m version.`
        );
      });
    }
  }
}

export default Compiler;
