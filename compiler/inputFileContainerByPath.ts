import readInputFile from './readInputFile';

async function inputFileContainerByPath(path: string) {
  const inputFile = await readInputFile();

  const inputFileContainers = inputFile.containers;

  for (let i = 0; i < inputFileContainers.length; i += 1) {
    const inputFileContainer = inputFileContainers[i];

    if (inputFileContainer.path === path) {
      return inputFileContainer;
    }
  }
}

export default inputFileContainerByPath;
