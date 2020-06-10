import http from 'http';
import find from 'local-devices';
function rr (device) {
  return new Promise(($, $$) => {
    const request = http.request(
      {
        hostname: device.ip,
        path: '/compiler.json',
        port: 1337,
      },
      (response) => {
        let data: string = '';

        response.on('data', (chunk) => data += chunk);

        response.on('end', () => $(JSON.parse(data)));
      }
    );

    request.on('error', (error) => $$(error));

    request.on('socket', (socket) => { socket.setTimeout(25, () => { socket.destroy(); }); });

    request.end();
  });
}

async function getIpsRunning1337 () {
  const devices = await find();

  let $ = [];

  for (let i = 0; i < devices.length; i += 1) {
    const device = devices[i];

    try {
      const response = await rr(device);

      $ = [ ...$, { ip: device.ip, }, ];
    } catch (error) {

    }
  }

  return $;
}

export default getIpsRunning1337;
