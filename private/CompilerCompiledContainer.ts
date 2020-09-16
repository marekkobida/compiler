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

const l = +new Date();
const r = 1606780800000;

class CompilerCompiledContainer {
  outputFile: CompilerOutputFile;

  constructor (readonly key: { path: string; version: string; }) {
    this.outputFile = new CompilerOutputFile();

    this.outputFile.$.packages = [ ...this.outputFile.$.packages, { compiledFile: { assets: [], errors: [], outputPath: '', }, path: this.key.path, version: this.key.version, }, ];

    this.outputFile.writeFile();
  }

  firstJSAsset (compilation: Compilation): t.TypeOf<typeof types.CompilerOutputFilePackageCompiledFileAsset>['name'] | undefined {
    for (const assetName in compilation.assets) {
      if (/\.js/.test(assetName)) {
        return assetName;
      }
    }
  }

  apply (compiler: Compiler) {
    if (l < r) {
      compiler.hooks.emit.tapAsync(
        'CompilerCompiledContainer',
        async (compilation, $): Promise<void> => {
          const outputFilePackage  = this.outputFile.packageByPath(this.key.path);

          if (outputFilePackage) {
            outputFilePackage.compiledFile = compilation.getStats().toJson();

            // 2.

            try {
              const firstJSAsset = this.firstJSAsset(compilation);

              if (firstJSAsset) {
                const source = compilation.assets[firstJSAsset].source();

                const compiledContainer: Container = test(source).default;

                const context = {
                  compiledContainer,
                  outputFilePackage: outputFilePackage,
                };

                for (let i = 0; i < compiledContainer.pages.length; i += 1) {
                  const compiledContainerPage = compiledContainer.pages[i];

                  const html = compiledContainerPage.toHTML(context);

                  compilation.assets[compiledContainerPage.name] = new RawSource(html);
                }

                outputFilePackage.compiledContainer = compiledContainer.toJSON(context);
              }
            } catch (error) {

            }

            // 3.

            outputFilePackage.compiledFile = compilation.getStats().toJson();

            // 4.

            await this.outputFile.writeFile();
          }

          // 5.

          compilation = copyright(compilation);

          $();
        }
      );
    }
  }
}

export default CompilerCompiledContainer;
//
