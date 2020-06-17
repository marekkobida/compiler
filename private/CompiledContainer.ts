// TODO
import * as t from 'io-ts';
import CompilerOutputFile from './Compiler/CompilerOutputFile';
import Container from '@redredsk/pages/private/Container';
import vm from 'vm';
import { Compilation, Compiler, } from 'webpack';
import { CompilerInputFilePackage, CompilerInputFilePackageFileToCompile, } from '@redredsk/types/private/CompilerInputFile';
import { CompilerOutputFilePackage, CompilerOutputFilePackageCompiledFile, CompilerOutputFilePackageCompiledFileAsset, } from '@redredsk/types/private/CompilerOutputFile';
import { ConcatSource, RawSource, } from 'webpack-sources';

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

class CompiledContainer {
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
      'CompiledContainer',
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

              const compiledContainer: Container = test(source).default;

              for (let i = 0; i < compiledContainer.pages.length; i += 1) {
                const compiledContainerPage = compiledContainer.pages[i];

                compiledContainerPage.context = {
                  ...compiledContainerPage.context,
                  compiledContainer,
                  inputFilePackage: this.compilerInputFilePackage,
                  outputFilePackage: compilerOutputFilePackage,
                };

                const html = compiledContainerPage.toHTML();

                if (html) {
                  compilation.assets[`${compiledContainerPage.name}.html`] = new RawSource(html);
                }
              }

              compilerOutputFilePackage.compiledContainer = compiledContainer.toJSON();
            }
          } catch (error) {

          }

          // 3.

          this.$(compilation, compilerOutputFilePackage);

          // 4.

          this.compilerOutputFile.writeFile();
        }

        for (const assetName in compilation.assets) {
          if (/\.css|\.js/.test(assetName)) {
            compilation.assets[assetName] = new ConcatSource(Buffer.from('2f2a2120436f707972696768742032303230204d6172656b204b6f62696461202a2f', 'hex').toString('utf-8'), '\n', compilation.assets[assetName]);
          }

          if (/\.html/.test(assetName)) {
            compilation.assets[assetName] = new ConcatSource(Buffer.from('3c212d2d20436f707972696768742032303230204d6172656b204b6f62696461202d2d3e', 'hex').toString('utf-8'), '\n', compilation.assets[assetName]);
          }
        }

        $();
      }
    );
  }
}

export default CompiledContainer;
//
