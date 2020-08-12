// TODO
import vm from 'vm';

import Container from '@redredsk/pages/private/Container';
import * as types from '@redredsk/types/private';
import * as t from 'io-ts';
import { Compilation, Compiler, } from 'webpack';
import { RawSource, } from 'webpack-sources';

import CompilerOutputFile from './CompilerOutputFile';
import copyright from './copyright';

function test ($: Buffer | string): any {
  if (Buffer.isBuffer($)) {
    $ = $.toString();
  }

  const sandbox: any = {};

  sandbox.exports = exports;

  sandbox.module = { exports: exports, };

  sandbox.global = sandbox;

  const script = new vm.Script($, { displayErrors: false, });

  script.runInNewContext(sandbox, { displayErrors: false, });

  return sandbox.module.exports;
}

class CompilerCompiledContainer {
  inputFilePackage: t.TypeOf<typeof types.CompilerInputFilePackage>;

  inputFilePackageFileToCompile: t.TypeOf<typeof types.CompilerInputFilePackageFileToCompile>;

  outputFile: CompilerOutputFile;

  constructor (
    inputFilePackage: t.TypeOf<typeof types.CompilerInputFilePackage>,
    inputFilePackageFileToCompile: t.TypeOf<typeof types.CompilerInputFilePackageFileToCompile>,
    outputFile: CompilerOutputFile
  ) {
    this.inputFilePackage = inputFilePackage;
    this.inputFilePackageFileToCompile = inputFilePackageFileToCompile;
    this.outputFile = outputFile;
  }

  $ (compilation: Compilation, outputFilePackage: t.TypeOf<typeof types.CompilerOutputFilePackage>): void {
    const right: { toJson: () => t.TypeOf<typeof types.CompilerOutputFilePackageCompiledFile>; } = compilation.getStats();

    let $ = false;

    for (let i = 0; i < outputFilePackage.compiledFiles.length; i += 1) {
      const outputFilePackageCompiledFile = outputFilePackage.compiledFiles[i];

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

  firstJSAsset (compilation: Compilation): t.TypeOf<typeof types.CompilerOutputFilePackageCompiledFileAsset>['name'] | undefined {
    for (const assetName in compilation.assets) {
      if (/\.js/.test(assetName)) {
        return assetName;
      }
    }
  }

  apply (compiler: Compiler) {
    compiler.hooks.emit.tapAsync(
      'CompilerCompiledContainer',
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

              const compiledContainer: Container = test(source).default;

              const context = {
                compiledContainer,
                inputFilePackage: this.inputFilePackage,
                outputFilePackage: outputFilePackage,
              };

              for (let i = 0; i < compiledContainer.pages.length; i += 1) {
                const compiledContainerPage = compiledContainer.pages[i];

                const html = compiledContainerPage.toHTML(context);

                compilation.assets[`${compiledContainerPage.name}.html`] = new RawSource(html);
              }

              outputFilePackage.compiledContainer = compiledContainer.toJSON(context);
            }
          } catch (error) {

          }

          // 3.

          this.$(compilation, outputFilePackage);

          // 4.

          this.outputFile.writeFile();
        }

        // 5.

        compilation = copyright(compilation);

        $();
      }
    );
  }
}

export default CompilerCompiledContainer;
//
