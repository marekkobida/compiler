import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import path from 'path';
import writeFile from '@redredsk/helpers/private/writeFile';
import { InputFilePackage, } from '@redredsk/compiler/private/types/InputFile';
import { OutputFilePackage, } from '@redredsk/compiler/private/types/OutputFile';

class CompiledContainer {
  constructor (inputFilePackage: t.TypeOf<typeof InputFilePackage>, outputFilePackage: t.TypeOf<typeof OutputFilePackage>) {
    try {
      for (let i = 0; i < outputFilePackage.compiledFiles.length; i += 1) {
        const outputFilePackageCompiledFile = outputFilePackage.compiledFiles[i];

        for (let ii = 0; ii < outputFilePackageCompiledFile.assets.length; ii += 1) {
          const outputFilePackageCompiledFileAsset = outputFilePackageCompiledFile.assets[ii];

          if (/\.js(?!\.map)/.test(outputFilePackageCompiledFileAsset.name)) {
            const $ = path.resolve(`${outputFilePackageCompiledFile.outputPath}/${outputFilePackageCompiledFileAsset.name}`);

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
                writeFile(`${outputFilePackageCompiledFile.outputPath}/${compiledContainerPage.name}.html`, compiledContainerPage.html);
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
