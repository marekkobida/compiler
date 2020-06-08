const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './private/index.ts'),
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
    filename: 'compiler.js',
    path: path.resolve(__dirname, '..'),
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
  ],
  resolve: {
    extensions: [
      '.js',
      '.ts',
    ],
  },
  target: 'node',
};
