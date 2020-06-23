const path = require('path');

module.exports = {
  entry: {
    redredsk: path.resolve(__dirname, './private/index.ts'),
  },
  experiments: {
    topLevelAwait: true,
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
  resolve: {
    extensions: [
      '.js',
      '.ts',
    ],
  },
  target: 'electron-main',
};
