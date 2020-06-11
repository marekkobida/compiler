import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import OutputFile from './OutputFile';
import evaluate from 'eval';
import { InputFilePackage, InputFilePackageFileToCompile, } from '@redredsk/compiler/private/types/InputFile';
import { OutputFilePackageCompiledFile, OutputFilePackageCompiledFileAsset, } from '@redredsk/compiler/private/types/OutputFile';
import { Compiler, } from 'webpack';

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

  // TODO toto vymeň za compilation.assets
  $ (outputFilePackageCompiledFile: t.TypeOf<typeof OutputFilePackageCompiledFile>): t.TypeOf<typeof OutputFilePackageCompiledFileAsset>['name'] | undefined {
    for (let i = 0; i < outputFilePackageCompiledFile.assets.length; i += 1) {
      const outputFilePackageCompiledFileAsset = outputFilePackageCompiledFile.assets[i];

      if (/\.js/.test(outputFilePackageCompiledFileAsset.name)) {
        return outputFilePackageCompiledFileAsset.name;
      }
    }
  }

  apply (compiler: Compiler) {
    compiler.hooks.emit.tapAsync(
      'CompiledContainer',
      async (compilation, callback): Promise<void> => {
        const outputFilePackage  = await this.outputFile.packageByPath(this.inputFilePackage.path);

        if (outputFilePackage) {
          // 1.

          const right: { toJson: () => t.TypeOf<typeof OutputFilePackageCompiledFile>, } = compilation.getStats();

          let $ = false;

          for (let i = 0; i < outputFilePackage[1].compiledFiles.length; i += 1) {
            let outputFilePackageCompiledFile = outputFilePackage[1].compiledFiles[i];

            if (outputFilePackageCompiledFile.path === this.inputFilePackageFileToCompile.path) {
              outputFilePackage[1].compiledFiles[i] = {
                ...right.toJson(),
                path: this.inputFilePackageFileToCompile.path,
              };

              $ = true;
            }
          }

          if (!$) {
            outputFilePackage[1].compiledFiles = [
              ...outputFilePackage[1].compiledFiles,
              {
                ...right.toJson(),
                path: this.inputFilePackageFileToCompile.path,
              },
            ];
          }

          // 2.

          try {
            for (let i = 0; i < outputFilePackage[1].compiledFiles.length; i += 1) {
              const outputFilePackageCompiledFile = outputFilePackage[1].compiledFiles[i];

              const $ = this.$(outputFilePackageCompiledFile);

              if ($) {
                const source = compilation.assets[$].source();

                const compiledContainer: Container = evaluate(source, $).default;

                for (let ii = 0; ii < compiledContainer.pages.length; ii += 1) {
                  const compiledContainerPage = compiledContainer.pages[ii];

                  compiledContainerPage.context = {
                    ...compiledContainerPage.context,
                    compiledContainer,
                    inputFilePackage: this.inputFilePackage,
                    outputFilePackage: outputFilePackage[1],
                  };

                  const html = compiledContainerPage.toHTML();

                  if (html) {
                    compilation.assets[`${compiledContainerPage.name}.html`] = {
                      size () {
                        return Buffer.byteLength(html);
                      },
                      source () {
                        return html;
                      },
                    };
                  }
                }

                // outputFilePackage[1].compiledContainer = compiledContainer.toJSON();
              }
            }
          } catch (error) {
            console.log('cicka', error);
          }

          console.log(compilation.assets);

          // 3.

          const outputFile = await this.outputFile.readFile();

          outputFile.packages[outputFilePackage[0]] = outputFilePackage[1];

          this.outputFile.writeFile(outputFile);
        }

        callback();
      }
    );
  }
}

export default CompiledContainer;
