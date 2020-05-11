import { outputFile } from './compile';

function containerByPath(path: string) {
  const outputFileContainers = outputFile.containers;

  for (let i = 0; i < outputFileContainers.length; i += 1) {
    const outputFileContainer = outputFileContainers[i];

    if (outputFileContainer.path === path) {
      return outputFileContainer;
    }
  }
}

export default containerByPath;
