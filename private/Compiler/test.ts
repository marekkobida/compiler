import http from 'http';
import os from 'os';

function testRequest (ip: string, method: 'DELETE' | 'PUT'): Promise<void> {
  return new Promise(($) => {
    const url = new URL('/devices.json', 'http://compiler.redred.sk');

    url.searchParams.set('ip', ip);

    const request = http.request(url, { method, }, (response) => {
      let data: string = '';

      response.on('data', (chunk) => data += chunk);

      response.on('end', $);
    });

    request.end();
  });
}

async function test (method: 'DELETE' | 'PUT'): Promise<void> {
  const networkInterfaces = os.networkInterfaces();

  for (let networkInterfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[networkInterfaceName];

    if (networkInterface) {
      for (const $ of networkInterface) {
        if ($.family !== 'IPv4' || $.internal !== false) {
          continue;
        }

        await testRequest($.address, method);
      }
    }
  }
}

export default test;
