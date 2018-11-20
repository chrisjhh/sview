import { getToken } from './fitbit_token';
import { duration } from './duration';

let request = require('https').request;
const querystring = require('querystring');


const defaultHttpOptions = {
  hostname: 'api.fitbit.com',
  port: 443,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
};
const api = '/1/user/-/activities';

const get = (token,path,params) =>
  new Promise((resolve,reject) => {
    if (params) {
      path += '?' + querystring.stringify(params);
    }
    let options = {...defaultHttpOptions, path: api + path};
    options.headers['Authorization'] = `Bearer ${token}`;
    const req = request(options, (res) => {
      let data = [];
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        let buffer = data.join('');
        resolve(JSON.parse(buffer.toString()));
      });
    });
    req.on('error', e => reject(e));
    req.end();
  });

const getWithToken = (path,params) =>
  getToken()
    .then(token => {
      if (!token) {
        return null;
      }
      return get(token,path,params);
    });

function pad(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}    

export const getHeartRateData = (start_time, duration) => {
  const d = new Date(start_time);
  const day = d.getFullYear() + '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate());
  const end = new Date(d.getTime() + duration * 1000);
  const time1 = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const time2 = pad(end.getHours()) + ':' + pad(end.getMinutes());
  return getWithToken(`/heart/date/${day}/1d/1sec/time/${time1}/${time2}.json`);
};