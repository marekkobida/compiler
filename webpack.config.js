const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './private/server/index.ts'),
  mode: 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(js|ts|tsx)$/,
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
    path: path.resolve(__dirname, '../..'),
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  target: 'node',
};
