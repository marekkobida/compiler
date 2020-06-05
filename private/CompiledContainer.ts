import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import path from 'path';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerInputFilePackage, } from '@redredsk/compiler/private/types/CompilerInputFile';
import { CompilerOutputFilePackage, } from '@redredsk/compiler/private/types/CompilerOutputFile';

class CompiledContainer {
  constructor (inputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>, outputFilePackage: t.TypeOf<typeof CompilerOutputFilePackage>) {
    try {
      for (let i = 0; i < outputFilePackage.compiledFiles.length; i += 1) {
        const compilerOutputFilePackageCompiledFile = outputFilePackage.compiledFiles[i];

        for (let ii = 0; ii < compilerOutputFilePackageCompiledFile.assets.length; ii += 1) {
          const compilerOutputFilePackageCompiledFileAsset = compilerOutputFilePackageCompiledFile.assets[ii];

          if (/\.js(?!\.map)/.test(compilerOutputFilePackageCompiledFileAsset.name)) {
            const $ = path.resolve(`${compilerOutputFilePackageCompiledFile.outputPath}/${compilerOutputFilePackageCompiledFileAsset.name}`);

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
                writeFile(`${compilerOutputFilePackageCompiledFile.outputPath}/${compiledContainerPage.name}.html`, compiledContainerPage.html);
              }
            }

            outputFilePackage.compiledContainer = compiledContainer.toJSON();

            return;
          }
        }
      }
    } catch (error) {}
  }
}

export default CompiledContainer;
