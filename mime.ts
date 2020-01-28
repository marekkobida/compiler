import path from 'path';

function mime ($: string): string {
  switch (path.extname($)) {
    case '.css':
      return 'text/css';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript';
    case '.map':
      return 'application/json';
    case '.otf':
      return 'font/otf';
    case '.png':
      return 'image/png';
    default:
      return 'text/plain';
  }
}

export default mime;
