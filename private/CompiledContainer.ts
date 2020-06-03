import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import path from 'path';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerInputFilePackage, } from '@redredsk/compiler/private/types/CompilerInputFile';
import { CompilerOutputFilePackage, } from '@redredsk/compiler/private/types/CompilerOutputFile';

class CompiledContainer {
  constructor (inputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>, outputFilePackage: t.TypeOf<typeof CompilerOutputFilePackage>) {
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
          writeFile(`${inputFilePackage.path}/public/${compiledContainerPage.name}.html`, compiledContainerPage.html);
        }
      }

      outputFilePackage.compiledContainer = compiledContainer.toJSON();
    } catch (error) {}
  }
}

export default CompiledContainer;
