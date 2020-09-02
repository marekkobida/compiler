const path = require('path');

module.exports = [
  {
    entry: path.resolve(__dirname, './private/CompilerCompiledContainer.ts'),
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
      filename: 'CompilerCompiledContainer.js',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, './public'),
    },
    plugins: [],
    resolve: {
      extensions: [
        '.js',
        '.ts',
      ],
    },
    target: 'node',
  },
  {
    entry: path.resolve(__dirname, './private/server.ts'),
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
      path: path.resolve(__dirname, './public'),
    },
    plugins: [],
    resolve: {
      extensions: [
        '.js',
        '.ts',
      ],
    },
    target: 'node',
  },
];
