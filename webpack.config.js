const path = require('path');

function client (inputFilePackage) {
  return {
    entry: path.resolve(inputFilePackage.path, './private/electron.ts'),
    externals: {
      webpack: 'commonjs webpack',
    },
    mode: inputFilePackage.version,
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
      filename: 'index.js',
      path: path.resolve(inputFilePackage.path),
    },
    plugins: [],
    resolve: {
      extensions: [
        '.js',
        '.ts',
      ],
    },
    target: 'electron-main',
  };
}

module.exports = client;
