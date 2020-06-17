import StatisticsFile from './StatisticsFile';
import http from 'http';
import p from './package.json';

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
              headers: [
                [ 'referer', request.headers.referer, ],
                [ 'user-agent', request.headers['user-agent'], ],
              ],
              url: new URL(urlFromRequestedUrlParameters).toString(),
            },
            ...statisticsFile.$.requests,
          ];

          statisticsFile.writeFile();
        }

        response.end(JSON.stringify(statisticsFile.$));

        return;
      }

      throw new Error('The request is not valid.');
    } catch (error) {
      response.statusCode = 500;

      response.end(JSON.stringify({ errors: [ error.message, ], }));
    }
  });

  server.listen(1338);

  process.stdout.write(`\x1b[31m    x  x\n x        x\nx          x\nx          x\n x        x\n    x  x\x1b[0m\n\n${p.name}\n${p.version}\n`);
}
