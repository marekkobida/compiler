import addMessage from './addMessage';
import afterCompilation from './afterCompilation';
import containerByPath from './containerByPath';
import inputFileContainerByPath from './inputFileContainerByPath';

const webpack = __non_webpack_require__('webpack');

let containers: {
  filesToCompile: [string, unknown][];
  path: string;
}[] = [];

async function compile(path: string, version: string) {
  if (containerByPath(path)) {
    throw new Error(`The path "${path}" exists in the compiler.`);
  }

  containers = [...containers, { filesToCompile: [], path }];

  const inputFileContainer = await inputFileContainerByPath(path);

  if (!inputFileContainer) {
    throw new Error(`The path "${path}" does not exist in the input file.`);
  }

  const inputFileContainerFilesToCompiler = inputFileContainer.filesToCompile;

  for (let i = 0; i < inputFileContainerFilesToCompiler.length; i += 1) {
    const inputFileContainerFileToCompile =
      inputFileContainer.filesToCompile[i];

    delete __non_webpack_require__.cache[
      __non_webpack_require__.resolve(inputFileContainerFileToCompile)
    ];

    webpack(
      __non_webpack_require__(inputFileContainerFileToCompile)(
        inputFileContainer,
        version
      )
    ).watch({}, (left: Error, right: { toJson: () => unknown }) => {
      addMessage(
        `The file "${inputFileContainerFileToCompile}" was compiled in the ${version} version.`
      );

      const addedContainer = containerByPath(path);

      if (addedContainer) {
        addedContainer.filesToCompile = [
          ...addedContainer.filesToCompile,
          [inputFileContainerFileToCompile, right.toJson()],
        ];
      }

      afterCompilation(inputFileContainer, () => (containers = []), version);
    });
  }

  addMessage(
    `The path "${path}" was added to the compiler in the ${version} version.`
  );
}

export { containers };

export default compile;
