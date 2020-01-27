function MIME (path: string): string {
  const $ = /([^.]+)$/.exec(path);

  switch ($ ? $[1] : '') {
    case 'css':
      return 'text/css';
    case 'html':
      return 'text/html; charset=utf-8';
      break;
    case 'js':
      return 'application/javascript';
    case 'map':
      return 'application/json';
    case 'otf':
      return 'font/otf';
    case 'png':
      return 'image/png';
    default:
      return 'text/plain';
  }
}

export default MIME;
