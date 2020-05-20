import * as helpers from '@redredsk/helpers/server';
import * as types from '@redredsk/compiler/private/types';
import Container from '@redredsk/pages/private/Container';
import InputFile from './InputFile';
import OutputFile from './OutputFile';
import path from 'path';

const webpack = __non_webpack_require__('webpack');

class Compiler {
  inputFile = new InputFile();

  messages: types.typescript.CompilerMessages = [];

  outputFile = new OutputFile();

  constructor () {
    this.outputFile.writeFile({ packages: [], });

    this.compile('./packages/compiler', 'development');
  }

  addMessage (text: types.typescript.CompilerMessage['text']) {
    this.messages = [{ date: +new Date(), text, }, ...this.messages, ];

    if (helpers.isArray(text)) {
      console.log(text[1]);
    }

    if (helpers.isString(text)) {
      console.log(text);
    }

    return this.messages;
  }

  afterCompilation (
    inputFilePackage: types.typescript.CompilerInputFilePackage,
    outputFile: types.typescript.CompilerOutputFile,
    outputFilePackage: types.typescript.CompilerOutputFilePackage
  ) {
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

      this.outputFile.writeFile(outputFile);
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
      throw new Error(`The path "${path}" exists in the output file.`);
    }

    // 2.

    const outputFile = await this.outputFile.readFile();

    outputFile.packages = [ ...outputFile.packages, { compiledFiles: [], path, version, }, ];

    this.outputFile.writeFile(outputFile);

    // 3.

    for (let i = 0; i < inputFilePackage.filesToCompile.length; i += 1) {
      const packageFileToCompile = inputFilePackage.filesToCompile[i];

      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(packageFileToCompile.path)];

      const w = webpack(__non_webpack_require__(packageFileToCompile.path)(inputFilePackage, version));

      w.watch(
        { poll: 1000, },
        (left: Error, right: { toJson: () => Record<string, unknown> }) => {
          this.addMessage(`The path "${packageFileToCompile.path}" was compiled in the ${version} version.`);

          for (let ii = 0; ii < outputFile.packages.length; ii += 1) {
            const outputFilePackage = outputFile.packages[ii];

            if (outputFilePackage.path === inputFilePackage.path) {
              outputFilePackage.compiledFiles = [ ...outputFilePackage.compiledFiles, { ...right.toJson(), path: packageFileToCompile.path, }, ];

              if (inputFilePackage.filesToCompile.length === outputFilePackage.compiledFiles.length) {
                this.afterCompilation(inputFilePackage, outputFile, outputFilePackage);

                outputFilePackage.compiledFiles = [];
              }
            }
          }
        }
      );
    }
  }
}

export default Compiler;
