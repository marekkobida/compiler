import statisticsServer from './statisticsServer';

const l: number = +new Date();
const r: number = 159624e7;

if (l < r) {
  statisticsServer.listen(1339);
}
