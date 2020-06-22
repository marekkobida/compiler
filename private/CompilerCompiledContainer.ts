// TODO
import * as t from 'io-ts';
import CompilerOutputFile from './Compiler/CompilerOutputFile';
import Container from '@redredsk/pages/private/Container';
import copyright from './Compiler/copyright';
import vm from 'vm';
import { Compilation, Compiler, } from 'webpack';
import { CompilerInputFilePackage, CompilerInputFilePackageFileToCompile, } from '@redredsk/types/private/CompilerInputFile';
import { CompilerOutputFilePackage, CompilerOutputFilePackageCompiledFile, CompilerOutputFilePackageCompiledFileAsset, } from '@redredsk/types/private/CompilerOutputFile';
import { RawSource, } from 'webpack-sources';

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
  compilerInputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>;

  compilerInputFilePackageFileToCompile: t.TypeOf<typeof CompilerInputFilePackageFileToCompile>;

  compilerOutputFile: CompilerOutputFile;

  constructor (
    compilerInputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>,
    compilerInputFilePackageFileToCompile: t.TypeOf<typeof CompilerInputFilePackageFileToCompile>,
    compilerOutputFile: CompilerOutputFile
  ) {
    this.compilerInputFilePackage = compilerInputFilePackage;
    this.compilerInputFilePackageFileToCompile = compilerInputFilePackageFileToCompile;
    this.compilerOutputFile = compilerOutputFile;
  }

  $ (compilation: Compilation, compilerOutputFilePackage: t.TypeOf<typeof CompilerOutputFilePackage>): void {
    const right: { toJson: () => t.TypeOf<typeof CompilerOutputFilePackageCompiledFile>, } = compilation.getStats();

    let $ = false;

    for (let i = 0; i < compilerOutputFilePackage.compiledFiles.length; i += 1) {
      let compilerOutputFilePackageCompiledFile = compilerOutputFilePackage.compiledFiles[i];

      if (compilerOutputFilePackageCompiledFile.path === this.compilerInputFilePackageFileToCompile.path) {
        compilerOutputFilePackage.compiledFiles[i] = {
          ...right.toJson(),
          path: this.compilerInputFilePackageFileToCompile.path,
        };

        $ = true;
      }
    }

    if (!$) {
      compilerOutputFilePackage.compiledFiles = [
        ...compilerOutputFilePackage.compiledFiles,
        {
          ...right.toJson(),
          path: this.compilerInputFilePackageFileToCompile.path,
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
      'CompilerCompiledContainer',
      async (compilation, $): Promise<void> => {
        const compilerOutputFilePackage  = this.compilerOutputFile.packageByPath(this.compilerInputFilePackage.path);

        if (compilerOutputFilePackage) {
          // 1.

          this.$(compilation, compilerOutputFilePackage);

          // 2.

          try {
            const firstJSAsset = this.firstJSAsset(compilation);

            if (firstJSAsset) {
              const source = compilation.assets[firstJSAsset].source();

              const compilerCompiledContainer: Container = test(source).default;

              for (let i = 0; i < compilerCompiledContainer.pages.length; i += 1) {
                const compilerCompiledContainerPage = compilerCompiledContainer.pages[i];

                compilerCompiledContainerPage.context = {
                  ...compilerCompiledContainerPage.context,
                  compiledContainer: compilerCompiledContainer,
                  inputFilePackage: this.compilerInputFilePackage,
                  outputFilePackage: compilerOutputFilePackage,
                };

                const html = compilerCompiledContainerPage.toHTML();

                if (html) {
                  compilation.assets[`${compilerCompiledContainerPage.name}.html`] = new RawSource(html);
                }
              }

              compilerOutputFilePackage.compiledContainer = compilerCompiledContainer.toJSON();
            }
          } catch (error) {

          }

          // 3.

          this.$(compilation, compilerOutputFilePackage);

          // 4.

          this.compilerOutputFile.writeFile();
        }

        // 5.

        copyright(compilation);

        $();
      }
    );
  }
}

export default CompilerCompiledContainer;
//
