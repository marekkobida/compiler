import json from './mime.json';

function mime (extension: string): string {
  for (const $ in json) {
    const extensions = json[$];

    for (let i = 0; i < extensions.length; i += 1) if (extensions[i] === extension) return $;
  }

  return 'text/plain';
}

export default mime;
