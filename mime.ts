interface Type {
  charset?: string;
  extensions: string[];
}

interface Types {
  [ typeName: string ]: Type;
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

function mime (extension: string): Type & { typeName: string } {
  for (const typeName in types) {
    const type = types[typeName];

    for (let i = 0; i < type.extensions.length; i += 1) {
      if (extension === type.extensions[i]) {
        return { ...type, typeName, };
      }
    }
  }

  return { extensions: [], typeName: 'text/plain', };
}

export default mime;
