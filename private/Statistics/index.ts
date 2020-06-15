import StatisticsFile from './StatisticsFile';
import http from 'http';
import mime from '@redredsk/helpers/private/mime';
import p from '../../package.json';
import path from 'path';
import readFile from '@redredsk/helpers/private/readFile';
import webpack from 'webpack';

const l: number = +new Date();
const r: number = 159624e7;

if (l < r) {
  const statisticsFile = new StatisticsFile();

  const server = http.createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
      response.statusCode = 200;

      const requestedURL = new URL(request.url, `http://${request.headers.host}`);
      const requestedURLParameters = requestedURL.searchParams;

      const isStatisticsFileRequested = requestedURL.pathname === `/${statisticsFile.fileName}`;

      if (isStatisticsFileRequested) {
        const urlFromRequestedUrlParameters = requestedURLParameters.get('url');

        if (request.headers.referer && request.headers['user-agent'] && urlFromRequestedUrlParameters) {
          statisticsFile.$.requests = [
            {
              headers: {
                referer: request.headers.referer,
                'user-agent': request.headers['user-agent'],
              },
              url: new URL(urlFromRequestedUrlParameters).toString(),
            },
            ...statisticsFile.$.requests,
          ];

          statisticsFile.writeFile();
        }

        response.end(JSON.stringify(statisticsFile.$));

        return;
      }

      const $ = mime(path.extname(requestedURL.pathname));

      response.setHeader('Content-Type', $.charset ? `${$.typeName}; charset=${$.charset}` : $.typeName);

      response.end(await readFile(`.${requestedURL.pathname}`, 'base64'), 'base64');
    } catch (error) {
      response.statusCode = 500;

      response.end(JSON.stringify({ errors: [ error.message, ], }));
    }
  });

  server.listen(1339);

  process.stdout.write(`\x1b[31m       x  x\n    x        x\n   x          x\n   x          x\n    x        x\n       x  x\x1b[0m\n\n      redred\n\n      ${p.name}\n      ${p.version}\n\n      webpack\n      ${webpack.version}\n\n`);
}
