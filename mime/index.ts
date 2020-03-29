import types, { Type, } from './types';

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
