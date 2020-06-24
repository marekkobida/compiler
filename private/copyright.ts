import webpack from 'webpack';
import { ConcatSource, } from 'webpack-sources';

function copyright (compilation: webpack.Compilation): webpack.Compilation {
  for (const assetName in compilation.assets) {
    if (/(\.css|\.js)$/.test(assetName)) {
      compilation.assets[assetName] = new ConcatSource(Buffer.from('2f2a2120436f707972696768742032303230204d6172656b204b6f62696461202a2f', 'hex').toString('utf-8'), '\n', compilation.assets[assetName]);
    }

    if (/\.html$/.test(assetName)) {
      compilation.assets[assetName] = new ConcatSource(Buffer.from('3c212d2d20436f707972696768742032303230204d6172656b204b6f62696461202d2d3e', 'hex').toString('utf-8'), '\n', compilation.assets[assetName]);
    }
  }

  return compilation;
}

export default copyright;
