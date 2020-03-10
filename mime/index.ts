import json from './index.json';

function mime (extension: string): string {
  for (const [ left, right, ] of Object.entries(json)) {
    for (let i = 0; i < right.extensions.length; i += 1) {
      if (right.extensions[i] === extension) {
        return left;
      }
    }
  }

  return 'text/plain';
}

export default mime;
