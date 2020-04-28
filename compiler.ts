import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '../types';
import Container from '@redred/pages/private/Container';
import p from 'path';

const webpack = __non_webpack_require__('webpack');

type CompilerInputFileContainer = t.TypeOf<
  typeof types.CompilerInputFileContainer
>;
type CompilerMessage = t.TypeOf<typeof types.CompilerMessage>;
type CompilerMessages = t.TypeOf<typeof types.CompilerMessages>;
type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

let containers: { compiled: Container; path: string }[] = [];

let inputFileName = 'compiler.json';

let messages: CompilerMessages = [];

let outputFileName = 'compiled.json';

function addMessage(text: CompilerMessage['text']) {
  messages = [{ date: +new Date(), text }, ...messages];
}

function afterCompilation(
  container: CompilerInputFileContainer,
  input: string,
  json: unknown,
  versionFromURL: string
) {
  addMessage(
    `The path "${container.path}" was compiled in the ${versionFromURL} version.`
  );

  const $ = p.resolve(container.path, 'public/server.js');

  delete __non_webpack_require__.cache[__non_webpack_require__.resolve($)];

  const compiledContainer: Container = __non_webpack_require__($).default;

  const addedContainer = containerByPath(container.path);

  if (addedContainer) {
    addedContainer.compiled.inputs[input] = json;

    if (
      Object.keys(addedContainer.compiled.inputs).length ===
      container.inputs.length
    ) {
      addedContainer.compiled.pages.forEach((page) => {
        page.context = {
          ...page.context,
          container: addedContainer.compiled,
        };

        page.toHTML();

        if (typeof page.html === 'string') {
          helpers.writeFile(
            `${addedContainer.path}/public/${page.name}.html`,
            page.html
          );
        }

        delete page.context.container;

        addMessage(
          `The file "${addedContainer.path}/public/${page.name}.html" was created.`
        );
      });

      toJSON();

      addedContainer.compiled.inputs = {};
    }

    return;
  }

  compiledContainer.inputs[input] = json;
  compiledContainer.path = container.path;
  compiledContainer.version = versionFromURL;

  containers = [
    ...containers,
    { compiled: compiledContainer, path: container.path },
  ];
}

async function compile(path: string, version: string) {
  if (containerByPath(path)) {
    throw new Error(`The path "${path}" exists in the compiler.`);
  }

  const inputFile = await readInputFile();

  const inputFileContainers = inputFile.containers;

  for (let i = 0; i < inputFileContainers.length; i += 1) {
    const inputFileContainer = inputFileContainers[i];

    if (path === inputFileContainer.path) {
      const inputFileContainerInputs = inputFileContainer.inputs;

      for (let i = 0; i < inputFileContainerInputs.length; i += 1) {
        const inputFileContainerInput = inputFileContainer.inputs[i];

        delete __non_webpack_require__.cache[
          __non_webpack_require__.resolve(inputFileContainerInput)
        ];

        webpack(
          __non_webpack_require__(inputFileContainerInput)(
            inputFileContainer,
            version
          )
        ).watch({}, (left: Error, right: { toJson: () => unknown }) => {
          try {
            afterCompilation(
              inputFileContainer,
              inputFileContainerInput,
              right.toJson(),
              version
            );
          } catch (error) {
            addMessage([error.message, error.stack]);
          }
        });
      }

      addMessage(
        `The path from the requested URL "${path}" was added to the compiler in the ${version} version.`
      );

      return;
    }
  }

  throw new Error(`The path "${path}" does not exist.`);
}

function containerByPath(path: string) {
  for (let i = 0; i < containers.length; i += 1) {
    const container = containers[i];

    if (container.path === path) {
      return container;
    }
  }
}

async function readInputFile() {
  return helpers.validateInputFromFile(types.CompilerInputFile, inputFileName);
}

async function readOutputFile() {
  return helpers.validateInputFromFile(
    types.CompilerOutputFile,
    outputFileName
  );
}

function toJSON() {
  const outputFile: CompilerOutputFile = { containers: [] };

  for (let i = 0; i < containers.length; i += 1) {
    const container = containers[i];

    outputFile.containers = [
      ...outputFile.containers,
      container.compiled.toJSON(),
    ];
  }

  helpers.writeFile(outputFileName, `${JSON.stringify(outputFile)}\n`);

  addMessage(`The file "${outputFileName}" was written.`);
}

export {
  addMessage,
  afterCompilation,
  compile,
  containerByPath,
  inputFileName,
  messages,
  outputFileName,
  readInputFile,
  readOutputFile,
  toJSON,
};
