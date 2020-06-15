const path = require('path');
// const webpack = require('webpack');

module.exports = {
  entry: {
    compiler: path.resolve(__dirname, './private/Compiler/index.ts'),
    statistics: path.resolve(__dirname, './private/Statistics/index.ts'),
  },
  externals: {
    webpack: 'commonjs webpack',
  },
  mode: 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(js|ts)$/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '..'),
  },
  // plugins: [
  //   new webpack.BannerPlugin({
  //     banner: '#!/usr/bin/env node --no-deprecation',
  //     raw: true,
  //   }),
  // ],
  resolve: {
    extensions: [
      '.js',
      '.ts',
    ],
  },
  target: 'node',
};
