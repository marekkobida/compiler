// TODO
import * as t from 'io-ts';
import CompilerOutputFile from './CompilerOutputFile';
import Container from '@redredsk/pages/private/Container';
import eval_ from 'eval';
import { Compilation, Compiler, } from 'webpack';
import { CompilerInputFilePackage, CompilerInputFilePackageFileToCompile, } from '@redredsk/types/private/CompilerInputFile';
import { CompilerOutputFilePackage, CompilerOutputFilePackageCompiledFile, CompilerOutputFilePackageCompiledFileAsset, } from '@redredsk/types/private/CompilerOutputFile';
import { ConcatSource, RawSource, } from 'webpack-sources';

class CompiledContainer {
  inputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>;

  inputFilePackageFileToCompile: t.TypeOf<typeof CompilerInputFilePackageFileToCompile>;

  outputFile: CompilerOutputFile;

  constructor (
    inputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>,
    inputFilePackageFileToCompile: t.TypeOf<typeof CompilerInputFilePackageFileToCompile>,
    outputFile: CompilerOutputFile
  ) {
    this.inputFilePackage = inputFilePackage;
    this.inputFilePackageFileToCompile = inputFilePackageFileToCompile;
    this.outputFile = outputFile;
  }

  $ (compilation: Compilation, outputFilePackage: t.TypeOf<typeof CompilerOutputFilePackage>): void {
    const right: { toJson: () => t.TypeOf<typeof CompilerOutputFilePackageCompiledFile>, } = compilation.getStats();

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

  firstJSAsset (compilation: Compilation): t.TypeOf<typeof CompilerOutputFilePackageCompiledFileAsset>['name'] | undefined {
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
                  compilation.assets[`${compiledContainerPage.name}.html`] = new RawSource(html);
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

        for (const assetName in compilation.assets) {
          if (/\.css|\.js/.test(assetName)) {
            compilation.assets[assetName] = new ConcatSource('/*! Copyright 2020 Marek Kobida */\n', compilation.assets[assetName]);
          }

          if (/\.html/.test(assetName)) {
            compilation.assets[assetName] = new ConcatSource('<!-- Copyright 2020 Marek Kobida -->\n', compilation.assets[assetName]);
          }
        }

        $();
      }
    );
  }
}

export default CompiledContainer;
//
