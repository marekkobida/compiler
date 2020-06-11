import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import OutputFile from './OutputFile';
import writeFile from '@redredsk/helpers/private/writeFile';
import { InputFilePackage, InputFilePackageFileToCompile, } from '@redredsk/compiler/private/types/InputFile';
import { OutputFilePackageCompiledFile, OutputFilePackageCompiledFileAsset, } from '@redredsk/compiler/private/types/OutputFile';

class CompiledContainer {
  inputFilePackage: t.TypeOf<typeof InputFilePackage>;

  inputFilePackageFileToCompile: t.TypeOf<typeof InputFilePackageFileToCompile>;

  outputFile: OutputFile;

  constructor (
    inputFilePackage: t.TypeOf<typeof InputFilePackage>,
    inputFilePackageFileToCompile: t.TypeOf<typeof InputFilePackageFileToCompile>,
    outputFile: OutputFile
  ) {
    this.inputFilePackage = inputFilePackage;
    this.inputFilePackageFileToCompile = inputFilePackageFileToCompile;
    this.outputFile = outputFile;
  }

  $ (outputFilePackageCompiledFile: t.TypeOf<typeof OutputFilePackageCompiledFile>): t.TypeOf<typeof OutputFilePackageCompiledFileAsset>['name'] | undefined {
    for (let i = 0; i < outputFilePackageCompiledFile.assets.length; i += 1) {
      const outputFilePackageCompiledFileAsset = outputFilePackageCompiledFile.assets[i];

      if (/\.js/.test(outputFilePackageCompiledFileAsset.name)) {
        return outputFilePackageCompiledFileAsset.name;
      }
    }
  }

  apply (compiler) {
    compiler.hooks.done.tap(
      'CompiledContainer',
      async (right: t.TypeOf<typeof OutputFilePackageCompiledFile>): Promise<void> => {
        const outputFilePackage  = await this.outputFile.packageByPath(this.inputFilePackage.path);

        if (outputFilePackage) {
          if (outputFilePackage[1].path === this.inputFilePackage.path) {
            // 1.

            let $ = false;

            for (let ii = 0; ii < outputFilePackage[1].compiledFiles.length; ii += 1) {
              let outputFilePackageCompiledFile = outputFilePackage[1].compiledFiles[ii];

              if (outputFilePackageCompiledFile.path === this.inputFilePackageFileToCompile.path) {
                outputFilePackage[1].compiledFiles[ii] = { ...right.toJson(), path: this.inputFilePackageFileToCompile.path, };

                $ = true;
              }
            }

            if (!$) {
              outputFilePackage[1].compiledFiles = [ ...outputFilePackage[1].compiledFiles, { ...right.toJson(), path: this.inputFilePackageFileToCompile.path, }, ];
            }

            // 2.

            try {
              for (let i = 0; i < outputFilePackage[1].compiledFiles.length; i += 1) {
                const outputFilePackageCompiledFile = outputFilePackage[1].compiledFiles[i];

                const $ = this.$(outputFilePackageCompiledFile);

                if ($) {
                  const compiledContainer: Container = (await import(/* webpackIgnore: true */ `${outputFilePackageCompiledFile.outputPath}/${$}`)).default.default;

                  for (let ii = 0; ii < compiledContainer.pages.length; ii += 1) {
                    const compiledContainerPage = compiledContainer.pages[ii];

                    compiledContainerPage.context = {
                      ...compiledContainerPage.context,
                      compiledContainer,
                      inputFilePackage: this.inputFilePackage,
                      outputFilePackage: outputFilePackage[1],
                    };

                    writeFile(`${outputFilePackageCompiledFile.outputPath}/${compiledContainerPage.name}.html`, compiledContainerPage.toHTML());
                  }

                  outputFilePackage[1].compiledContainer = compiledContainer.toJSON();
                }
              }
            } catch (error) {

            }

            // 3.

            const outputFile = await this.outputFile.readFile();

            outputFile.packages[outputFilePackage[0]] = outputFilePackage[1];

            this.outputFile.writeFile(outputFile);
          }
        }
      }
    );
  }
}

export default CompiledContainer;
