/* eslint-disable */
// @ts-nocheck

import Compiler from './Compiler';

const webpack = __non_webpack_require__('webpack');

function compile(compiler: Compiler) {
  const containers = compiler.containers;

  containers.forEach((container) => {

    container.inputs.forEach((input, inputPath) => {
      delete __non_webpack_require__.cache[__non_webpack_require__.resolve(inputPath)];
      const ww = __non_webpack_require__(inputPath);

      webpack(ww(container)).watch({}, (...b) => {
        container.inputs.set(inputPath, b[1]);

        const $ = container.inputs.get('./packages/compiler/webpack/client.js');

        if ($) {
          const assets = Object.keys($.compilation.assets).map((asset) => `./assets/${asset}`);

          container.assets = [];

          for (let i = 0; i < assets.length; i += 1) {
            container.assets = [
              ...container.assets,
              assets[i],
            ];
          }
        }

        compiler.afterCompilation(container);
      });
    });
  });
}

export default compile;
