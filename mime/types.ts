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

export default types;

export { Type, Types, };
