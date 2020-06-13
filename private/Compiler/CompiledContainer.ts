// TODO
import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import OutputFile from './OutputFile';
import eval_ from 'eval';
import { Compilation, Compiler, } from 'webpack';
import { InputFilePackage, InputFilePackageFileToCompile, } from '@redredsk/types/private/InputFile';
import { OutputFilePackage, OutputFilePackageCompiledFile, OutputFilePackageCompiledFileAsset, } from '@redredsk/types/private/OutputFile';

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

  $ (compilation: Compilation, outputFilePackage: t.TypeOf<typeof OutputFilePackage>): void {
    const right: { toJson: () => t.TypeOf<typeof OutputFilePackageCompiledFile>, } = compilation.getStats();

    let $ = false;

    for (let i = 0; i < outputFilePackage.compiledFiles.length; i += 1) {
      let outputFilePackageCompiledFile = outputFilePackage.compiledFiles[i];

      if (outputFilePackageCompiledFile.path === this.inputFilePackageFileToCompile.path) {
        outputFilePackage.compiledFiles[i] = {
          ...right.toJson(),
          path: this.inputFilePackageFileToCompile.path,
        };

        $ = true;
      }
    }

    if (!$) {
      outputFilePackage.compiledFiles = [
        ...outputFilePackage.compiledFiles,
        {
          ...right.toJson(),
          path: this.inputFilePackageFileToCompile.path,
        },
      ];
    }
  }

  firstJSAsset (compilation: Compilation): t.TypeOf<typeof OutputFilePackageCompiledFileAsset>['name'] | undefined {
    for (const assetName in compilation.assets) {
      if (/\.js/.test(assetName)) {
        return assetName;
      }
    }
  }

  apply (compiler: Compiler) {
    compiler.hooks.emit.tapAsync(
      'CompiledContainer',
      async (compilation, $): Promise<void> => {
        const outputFilePackage  = this.outputFile.packageByPath(this.inputFilePackage.path);

        if (outputFilePackage) {
          // 1.

          this.$(compilation, outputFilePackage);

          // 2.

          try {
            const firstJSAsset = this.firstJSAsset(compilation);

            if (firstJSAsset) {
              const source = compilation.assets[firstJSAsset].source();

              const compiledContainer: Container = eval_(source, firstJSAsset).default;

              for (let i = 0; i < compiledContainer.pages.length; i += 1) {
                const compiledContainerPage = compiledContainer.pages[i];

                compiledContainerPage.context = {
                  ...compiledContainerPage.context,
                  compiledContainer,
                  inputFilePackage: this.inputFilePackage,
                  outputFilePackage,
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

              outputFilePackage.compiledContainer = compiledContainer.toJSON();
            }
          } catch (error) {
            console.log(error);
          }

          // 3.

          this.$(compilation, outputFilePackage);

          // 4.

          this.outputFile.writeFile();
        }

        $();
      }
    );
  }
}

export default CompiledContainer;
//
