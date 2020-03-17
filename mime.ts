interface Types {
  [ type: string ]: {
    charset?: string;
    extensions: string[];
  };
}

const types: Types = {
  'application/javascript': {
    extensions: [
      '.js',
    ],
  },
  'application/json': {
    charset: 'utf-8',
    extensions: [
      '.json',
      '.map',
    ],
  },
  'font/otf': {
    extensions: [
      '.otf',
    ],
  },
  'image/png': {
    extensions: [
      '.png',
    ],
  },
  'image/x-icon': {
    extensions: [
      '.ico',
    ],
  },
  'text/css': {
    charset: 'utf-8',
    extensions: [
      '.css',
    ],
  },
  'text/html': {
    charset: 'utf-8',
    extensions: [
      '.html',
    ],
  },
};

function mime (extension: string): Types[0] & { type: string } {
  for (const type in types) {
    const $ = types[type];

    for (let i = 0; i < $.extensions.length; i += 1) {
      if (extension === $.extensions[i]) {
        return { ...$, type, };
      }
    }
  }

  return { extensions: [], type: 'text/plain', };
}

export default mime;
