const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './private/index.ts'),
  mode: 'production',
  module: {
    rules: [
      {
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
  resolve: {
    extensions: ['.js', '.ts'],
  },
  target: 'node',
};
