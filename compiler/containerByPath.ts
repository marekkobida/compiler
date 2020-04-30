import { containers } from './compile';

function containerByPath(path: string) {
  for (let i = 0; i < containers.length; i += 1) {
    const container = containers[i];

    if (container.path === path) {
      return container;
    }
  }
}

export default containerByPath;
