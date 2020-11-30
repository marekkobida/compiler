import * as t from 'io-ts';
import vm from 'vm';
import { Compilation, Compiler } from 'webpack';
import { RawSource } from 'webpack-sources';

import * as types from '@redredsk/types';
import Container from '@redredsk/pages/private/Container';

import CompilerOutputFile from './CompilerOutputFile';
// import copyright from './copyright';

function test($: Buffer | string): any {
  if (Buffer.isBuffer($)) {
    $ = $.toString();
  }

  const sandbox: any = {};

  sandbox.exports = exports;

  sandbox.module = { exports: exports };

  sandbox.global = sandbox;

  const script = new vm.Script($, { displayErrors: false });

  script.runInNewContext(sandbox, { displayErrors: false });

  return sandbox.module.exports;
}

class CompilerCompiledContainer {
  outputFile: CompilerOutputFile;

  constructor(readonly key: { inputPath: string; version: string }) {
    this.outputFile = new CompilerOutputFile();

    this.outputFile.$.packages = [
      ...this.outputFile.$.packages,
      {
        assets: [],
        errors: [],
        inputPath: this.key.inputPath,
        version: this.key.version,
      },
    ];

    this.outputFile.writeFile();
  }

  firstJSAsset(
    compilation: Compilation
  ): t.TypeOf<typeof types.CompilerOutputFilePackageAsset>['name'] | undefined {
    for (const assetName in compilation.assets) {
      if (/\.js$/.test(assetName)) {
        return assetName;
      }
    }
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tap('CompilerCompiledContainer', compilation => {
      const outputFilePackage = this.outputFile.packageByPath(
        this.key.inputPath
      );

      if (outputFilePackage) {
        outputFilePackage.assets = compilation.getStats().toJson().assets;
        outputFilePackage.errors = compilation.getStats().toJson().errors;
        outputFilePackage.outputPath = compilation
          .getStats()
          .toJson().outputPath;

        // 2.

        try {
          const firstJSAsset = this.firstJSAsset(compilation);

          if (firstJSAsset) {
            const source = compilation.assets[firstJSAsset].source();

            const compiledContainer: Container = test(source).default;

            const context = { outputFilePackage };

            for (let i = 0; i < compiledContainer.pages.length; i += 1) {
              const compiledContainerPage = new compiledContainer.pages[i]();

              const html = compiledContainerPage.toHTML(context);

              compilation.assets[
                compiledContainerPage.fileName
              ] = new RawSource(html);
            }

            outputFilePackage.compiledContainer = compiledContainer.toJSON(
              context
            );
          }
        } catch (error) {}

        // 3.

        outputFilePackage.assets = compilation.getStats().toJson().assets;
        outputFilePackage.errors = compilation.getStats().toJson().errors;
        outputFilePackage.outputPath = compilation
          .getStats()
          .toJson().outputPath;

        // 4.

        this.outputFile.writeFile();
      }

      // 5.

      // compilation = copyright(compilation);
    });
  }
}

export default CompilerCompiledContainer;
