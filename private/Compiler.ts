import * as helpers from '@redredsk/helpers/server';
import * as types from '@redredsk/compiler/private/types';
import Container from '@redredsk/pages/private/Container';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import path from 'path';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  inputFile: InputFile;

  messages: types.typescript.CompilerMessages = [];

  outputFile: OutputFile;

  constructor (inputFile: InputFile = new InputFile(), outputFile: OutputFile = new OutputFile()) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;

    this.test();
  }

  private addMessage (text: types.typescript.CompilerMessage['text']): void {
    this.messages = [{ date: +new Date(), text, }, ...this.messages, ];

    if (helpers.isArray(text)) {
      console.log(text[1]);
    }

    if (helpers.isString(text)) {
      console.log(text);
    }
  }

  private afterCompilation (inputFilePackage: types.typescript.CompilerInputFilePackage, outputFilePackage: types.typescript.CompilerOutputFilePackage) {
    try {
      const $ = path.resolve(inputFilePackage.path, 'public/server.js');

      delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

      const compiledContainer: Container = __non_webpack_require__($).default;

      for (let i = 0; i < compiledContainer.pages.length; i += 1) {
        const compiledContainerPage = compiledContainer.pages[i];

        compiledContainerPage.context = {
          ...compiledContainerPage.context,
          compiledContainer,
          inputFilePackage,
          outputFilePackage,
        };

        compiledContainerPage.toHTML();

        if (typeof compiledContainerPage.html === 'string') {
          helpers.writeFile(`${inputFilePackage.path}/public/${compiledContainerPage.name}.html`, compiledContainerPage.html);

          this.addMessage(`The file "${inputFilePackage.path}/public/${compiledContainerPage.name}.html" was written.`);
        }
      }

      outputFilePackage.compiledContainer = compiledContainer.toJSON();
    } catch (error) {
      this.addMessage([ error.message, error.stack, ]);
    }
  }

  async compile (path: types.typescript.CompilerInputFilePackage['path'], version: types.typescript.CompilerInputFilePackage['version']) {
    // 1.

    const inputFilePackage = await this.inputFile.packageByPath(path);

    let outputFilePackage;

    try {
      outputFilePackage  = await this.outputFile.packageByPath(path);
    } catch (error) {

    }

    if (outputFilePackage) {
      throw new Error(`The package "${path}" exists in the output file.`);
    }

    // 2.

    const outputFile = await this.outputFile.readFile();

    outputFile.packages = [ ...outputFile.packages, { compiledFiles: [], path, version, }, ];

    this.outputFile.writeFile(outputFile);

    this.addMessage(`The output file "${this.outputFile.fileName}" was written.`);

    // 3.

    for (let i = 0; i < inputFilePackage.filesToCompile.length; i += 1) {
      const packageFileToCompile = inputFilePackage.filesToCompile[i];

      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(packageFileToCompile.path)];

      const w = webpack(__non_webpack_require__(packageFileToCompile.path)(inputFilePackage, version));

      w.watch(
        { poll: 1000, },
        (left: Error, right: { toJson: () => Record<string, unknown> }) => {
          this.addMessage(`The file "${packageFileToCompile.path}" was compiled in the ${version} version.`);

          for (let ii = 0; ii < outputFile.packages.length; ii += 1) {
            const outputFilePackage = outputFile.packages[ii];

            if (outputFilePackage.path === inputFilePackage.path) {
              outputFilePackage.compiledFiles = [ ...outputFilePackage.compiledFiles, { ...right.toJson(), path: packageFileToCompile.path, }, ];

              if (inputFilePackage.filesToCompile.length === outputFilePackage.compiledFiles.length) {
                this.afterCompilation(inputFilePackage, outputFilePackage);

                this.outputFile.writeFile(outputFile);

                this.addMessage(`The output file "${this.outputFile.fileName}" was written.`);

                outputFilePackage.compiledFiles = [];
              }
            }
          }
        }
      );
    }
  }

  private async test (): Promise<void> {
    this.outputFile.writeFile({ packages: [], });

    const inputFile = await this.inputFile.readFile();

    const inputFilePackages = inputFile.packages;

    for (let i = 0; i < inputFilePackages.length; i += 1) {
      const inputFilePackage = inputFilePackages[i];

      if (inputFilePackage.isActive) {
        await this.compile(inputFilePackage.path, inputFilePackage.version);
      }
    }
  }
}

export default Compiler;
