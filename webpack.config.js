const path = require('path');

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
    libraryTarget: 'umd',
    path: path.resolve(__dirname, '..'),
  },
  resolve: {
    extensions: [
      '.js',
      '.ts',
    ],
  },
  target: 'node',
};
